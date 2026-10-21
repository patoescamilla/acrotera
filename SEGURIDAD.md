# Security notes

Revisión de seguridad del código y de la configuración de la base de datos, hecha el 26 de agosto de 2026.

---

## Hallazgos corregidos

### 1. Escalada de privilegios (crítico)

Cualquier usuario registrado podía convertirse en administrador desde la consola del navegador:

```js
await supabase.from('profiles').update({ role: 'admin' }).eq('id', miId)
```

La política de RLS solo exigía que el registro fuera del propio usuario, y lo era. Con eso el usuario obtenía acceso completo al panel: precios, pedidos y datos de clientes. Un comentario en el esquema afirmaba que esto no era posible, y era incorrecto.

**Corrección (`migration-04-seguridad.sql`)**, por dos vías independientes:
- Se revocó el privilegio de escritura sobre la columna `role`; los usuarios solo pueden modificar `full_name`.
- Un trigger rechaza el cambio de rol si viene de una sesión de navegador. Si en el futuro se vuelven a otorgar permisos por error, el trigger sigue bloqueando el cambio.

### 2. Función de inventario expuesta (moderado)

Supabase expone como API las funciones del esquema `public`. `decrement_stock` corre con privilegios elevados (`SECURITY DEFINER`), así que cualquiera podía llamarla con el id de un pedido y dejar productos sin existencia sin comprar nada.

**Corrección:** se revocó el permiso de ejecución para `anon` y `authenticated`. Solo el servidor puede invocarla.

---

## Estado por punto

| # | Requerimiento | Estado |
|---|---|---|
| 1 | Ocultar claves API | Hecho |
| 2 | Eliminar secretos de git | Hecho, historial revisado |
| 3 | Clave pública de base de datos | Hecho |
| 4 | Activar RLS | Hecho |
| 5 | Cifrar datos sensibles | Cubierto por la plataforma |
| 6 | Forzar autenticación del servidor | Hecho |
| 7 | Restringir acceso a registros | Hecho |
| 8 | Bloquear manipulación de campos | Corregido |
| 9 | Proteger cookies de sesión | Hecho |
| 10 | Hashear contraseñas | Hecho por Supabase |
| 11 | Limitar intentos de inicio de sesión | Parcial |
| 12 | Protección contra bots | Pendiente |
| 13 | Monitorizar consultas | Pendiente, baja prioridad |
| 14 | Validar entradas | Reforzado |
| 15 | Escapar contenido de usuario | Hecho |
| 16 | Restringir subida de archivos | Corregido |
| 17 | Limitar peticiones a la API | Pendiente |
| 18 | Cabeceras de seguridad | Hecho |
| 19 | Forzar HTTPS | Hecho |
| 20 | Escanear dependencias | Hecho |

---

## Detalle

**1. Ocultar claves API.** Las llaves viven en `.env.local`, que está en `.gitignore`. El cliente que usa la `service_role` importa `server-only`: si se usa en un componente de navegador, la compilación falla en lugar de exponer la llave.

**2. Eliminar secretos de git.** Se revisó el historial completo del repositorio y no contiene llaves ni archivos `.env`. Si alguna vez se sube uno por error, borrarlo en un commit nuevo no basta: queda en el historial y hay que rotar todas las llaves.

**3. Clave pública de base de datos.** El navegador solo recibe la `anon key`, que está diseñada para ser pública. Lo que protege los datos son las políticas de RLS, no esconder esa llave. La `service_role` nunca sale del servidor.

**4. Activar RLS.** Activo en todas las tablas: perfiles, categorías, productos, imágenes de producto, pedidos, artículos de pedido, imágenes del sitio y ajustes.

**5. Cifrar datos sensibles.** Supabase cifra el disco y todo el tráfico va por TLS. Los datos de tarjeta nunca pasan por este servidor: se capturan en la página de Stripe. Lo más sensible que se guarda son direcciones y teléfonos. Cifrarlos por columna impediría buscar y ordenar pedidos en el panel, así que no se hizo.

**6. Forzar autenticación del servidor.** Tres capas: el middleware bloquea `/admin` antes de renderizar, cada server action vuelve a verificar el rol (el middleware solo no es una frontera de seguridad) y RLS niega los datos aunque las dos anteriores fallen.

**7. Restringir acceso a registros.** Un visitante solo ve productos publicados. Un cliente solo ve sus propios pedidos. Los pedidos solo se crean desde el servidor.

**8. Bloquear manipulación de campos.** Ver el hallazgo 1. Además, los formularios del panel escriben una lista explícita de campos, y el checkout recibe solo el id del producto y la cantidad: precio, estado e inventario se leen de la base.

**9. Proteger cookies de sesión.** Supabase las emite con `httpOnly`, `secure` y `sameSite`. Con HSTS, además, no viajan sin cifrar.

**10. Hashear contraseñas.** Supabase Auth las guarda con bcrypt. La aplicación nunca recibe la contraseña: el formulario habla directo con el servicio de autenticación.

**11. Limitar intentos de inicio de sesión.** Supabase aplica límites propios en sus endpoints de autenticación. Se ajustan en **Authentication → Rate Limits**, no desde el código.

**12. Protección contra bots.** No hay. Un script podría registrar cuentas en masa. Pendiente: activar CAPTCHA en **Authentication → Attack Protection** de Supabase (soporta Cloudflare Turnstile). El checkout pasa por Stripe, que tiene su propia detección de fraude.

**13. Monitorizar consultas.** Supabase incluye registros y métricas en Logs. No hay alertas configuradas.

**14. Validar entradas.** El checkout valida el formato de los ids, limita a 30 productos distintos y 20 piezas por producto, recorta cada campo a un largo máximo, quita caracteres de control y valida el correo. Los formularios del panel validan lo esencial. Una librería de esquemas daría validación uniforme en todo el proyecto.

**15. Escapar contenido de usuario.** React escapa todo por defecto y el proyecto no inserta HTML crudo en ningún lugar.

**16. Restringir subida de archivos.** Antes el tipo y el peso se validaban solo en el navegador, lo que se evita con una petición hecha a mano. Ahora Supabase Storage los impone: solo JPG, PNG, WebP y AVIF, 5 MB para productos y 8 MB para imágenes del sitio.

**17. Limitar peticiones a la API.** Pendiente. `/api/checkout` no tiene límite de peticiones: llamarlo en bucle llenaría la tabla con pedidos pendientes. No expone datos ni cobra de más, y los topes de entrada del punto 14 acotan el daño.

**18. Cabeceras de seguridad.** HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy`, configuradas en `next.config.ts`. Falta Content-Security-Policy: requiere nonces para los scripts que inyecta Next, y una mal configurada rompe el sitio sin avisar.

**19. Forzar HTTPS.** Netlify sirve el sitio por HTTPS. La cabecera HSTS hace que el navegador rechace HTTP durante dos años.

**20. Escanear dependencias.** El escaneo encontró dos vulnerabilidades altas en dependencias de Next (procesamiento de imágenes y CSS). Se forzaron versiones corregidas con `overrides` en `package.json`, sin cambiar la versión mayor de Next.

---

## Pendientes

- Activar CAPTCHA (Turnstile) en Supabase.
- Volver a exigir confirmación de correo cuando haya SMTP propio.
- Límite de peticiones para `/api/checkout`.
- Content-Security-Policy.
- Dependabot en GitHub.

## Alcance

Esta revisión cubre el código del repositorio y la configuración de la base de datos. No es una auditoría profesional ni una prueba de penetración: no se probó el sitio en ejecución ni la seguridad interna de Supabase, Stripe o Netlify.
