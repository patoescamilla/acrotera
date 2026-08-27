# Revisión de seguridad — Acrotera

Fecha: 26 de agosto de 2026. Revisión hecha sobre el código, no de memoria.

---

## Dos hallazgos graves, ya corregidos

### 1. Escalada de privilegios (crítico)

Cualquier usuario registrado podía convertirse en administrador desde la consola de su propio navegador:

```js
await supabase.from('profiles').update({ role: 'admin' }).eq('id', miId)
```

La política de seguridad exigía que el registro fuera suyo — y lo era. Pasaba la validación y quedaba con acceso total al panel: precios, pedidos, datos de clientes.

El comentario que yo mismo había escrito en el esquema afirmaba que esto no era posible. Estaba equivocado.

**Corregido en `migration-04-seguridad.sql`** por dos vías independientes: se revocó el privilegio de escritura sobre la columna `role` (solo queda `full_name`), y se añadió un disparador que rechaza el cambio si viene de una sesión de navegador. Si alguien vuelve a otorgar permisos por error, el disparador sigue tapando el hueco.

### 2. Función de inventario expuesta (moderado)

Supabase publica automáticamente como API las funciones del esquema `public`. `decrement_stock` corre con privilegios elevados, así que cualquiera podía llamarla con el identificador de un pedido y descontar existencias a voluntad — dejando productos en cero sin comprar nada.

**Corregido:** solo el servidor puede invocarla.

---

## Tu lista, punto por punto

| # | Requerimiento | Estado |
|---|---|---|
| 1 | Ocultar claves API | Hecho |
| 2 | Eliminar secretos de git | Preparado, verificar al subir |
| 3 | Clave pública de base de datos | Hecho |
| 4 | Activar RLS | Hecho |
| 5 | Cifrar datos sensibles | Cubierto por la plataforma |
| 6 | Forzar autenticación del servidor | Hecho |
| 7 | Restringir acceso a registros | Hecho |
| 8 | Bloquear manipulación de campos | **Corregido hoy** |
| 9 | Proteger cookies de sesión | Hecho |
| 10 | Hashear contraseñas | Hecho por Supabase |
| 11 | Limitar intentos de inicio | Parcial — revisar en el panel |
| 12 | Protección contra bots | **Pendiente** |
| 13 | Monitorizar consultas | Pendiente, baja prioridad |
| 14 | Validar entradas | Reforzado hoy |
| 15 | Escapar contenido de usuario | Hecho |
| 16 | Restringir subida de archivos | **Corregido hoy** |
| 17 | Limitar respuestas de API | **Pendiente** |
| 18 | Cabeceras de seguridad | Hecho hoy |
| 19 | Forzar HTTPS | Hecho hoy |
| 20 | Escanear dependencias | Hecho hoy |

---

## Detalle

**1. Ocultar claves API.** Las llaves viven en `.env.local`, que está en `.gitignore`. La `service_role` se importa desde un archivo marcado con `server-only`: si alguien intentara usarla en un componente de navegador, la compilación falla en vez de filtrarla en silencio.

**2. Eliminar secretos de git.** Todavía no hay repositorio, así que no hay nada que limpiar. Antes del primer `push`, confirma en GitHub Desktop que `.env.local` no aparezca en la lista de archivos. Si algún día se sube por error, no basta con borrarlo en un commit nuevo: queda en el historial y hay que rotar todas las llaves.

**3. Clave pública de base de datos.** El navegador solo recibe la `anon key`, que está diseñada para ser pública. Lo que protege los datos no es esconderla, sino las políticas de RLS. La `service_role`, que se salta todo, nunca sale del servidor.

**4. Activar RLS.** Activo en las seis tablas: perfiles, categorías, productos, imágenes, pedidos y artículos de pedido, más las dos de contenido editable. Sin excepciones.

**5. Cifrar datos sensibles.** Supabase cifra el disco, y todo el tráfico va por TLS. Lo verdaderamente delicado — los datos de tarjeta — nunca toca este servidor: el cliente los teclea en la página de Stripe. Lo más sensible que guardamos son direcciones y teléfonos. Cifrarlos por columna es posible, pero volvería imposible buscar y ordenar pedidos en el panel. Para una tienda de este tamaño no lo recomiendo.

**6. Forzar autenticación del servidor.** Tres capas. El middleware bloquea `/admin` antes de renderizar nada. Cada acción del panel vuelve a verificar el rol del lado del servidor, porque el middleware por sí solo no es una frontera de seguridad. Y RLS niega los datos aunque las dos anteriores fallaran.

**7. Restringir acceso a registros.** Un visitante solo ve productos publicados. Un cliente solo ve sus propios pedidos. Los pedidos únicamente se crean desde el servidor.

**8. Bloquear manipulación de campos.** Aquí estaba el hueco grave. Ya cerrado. Lo que sí estaba bien desde el principio: los formularios del panel escriben una lista explícita de campos, y **los precios nunca vienen del navegador** — el checkout recibe solo el identificador del producto y la cantidad, y relee precio, estado e inventario de la base.

**9. Proteger cookies de sesión.** Las emite Supabase con `httpOnly` (JavaScript no puede leerlas), `secure` (solo por HTTPS) y `sameSite`. Con la cabecera HSTS que agregué hoy, además no viajan nunca en claro.

**10. Hashear contraseñas.** Las maneja Supabase con bcrypt. Este código nunca ve una contraseña: el formulario habla directo con el servicio de autenticación.

**11. Limitar intentos de inicio de sesión.** Supabase trae límites propios en sus endpoints de autenticación. No son configurables desde el código. Revísalos en **Authentication → Rate Limits** y ajústalos si el valor por defecto te parece flojo.

**12. Protección contra bots.** No hay. Hoy un script podría registrar cuentas en masa. Antes de publicar, activa CAPTCHA en **Authentication → Attack Protection** — Supabase se integra con Cloudflare Turnstile, que es gratis e invisible para el usuario normal. El checkout está más protegido: pasa por Stripe, que trae su propia detección de fraude.

**13. Monitorizar consultas.** Supabase incluye registros y métricas en la sección Logs. No hay alertas configuradas. Con el volumen inicial no hace falta; vale la pena cuando haya tráfico real.

**14. Validar entradas.** Reforzado hoy en el checkout: formato de identificadores, tope de 30 artículos distintos y 20 piezas por artículo, largo máximo por campo, limpieza de caracteres de control y validación del correo. Los formularios del panel validan lo esencial. Como mejora futura, una librería de esquemas daría validación uniforme en todos lados.

**15. Escapar contenido de usuario.** React escapa todo por defecto. Revisé el proyecto completo: no hay una sola inserción de HTML crudo. Esa es la puerta habitual de los ataques de scripting, y está cerrada por construcción.

**16. Restringir subida de archivos.** Antes se validaba tipo y peso solo en el navegador, lo que se brinca con una petición hecha a mano. Ahora los límites los impone Supabase del lado del servidor: solo JPG, PNG, WebP y AVIF, 5 MB para productos y 8 MB para las imágenes del sitio.

**17. Limitar respuestas de API.** Pendiente. El endpoint de checkout no tiene límite de peticiones: alguien podría llamarlo en bucle y llenar la tabla de pedidos pendientes. No expone datos ni cobra de más, pero ensucia. Los topes de entrada que puse hoy acotan el daño. La solución real llega con el despliegue: Vercel incluye un cortafuegos con límite de peticiones que se configura sin tocar código.

**18. Cabeceras de seguridad.** Agregadas hoy: HSTS, `nosniff`, anti-clickjacking, política de referente y desactivación de cámara, micrófono y ubicación. Falta la Content-Security-Policy, que es la más potente y también la más fácil de romper — necesita firmas para los scripts que Next inyecta. Queda anotada como pendiente deliberado, no como olvido.

**19. Forzar HTTPS.** Vercel redirige todo a HTTPS automáticamente. La cabecera HSTS añade que el navegador se niegue a usar HTTP durante dos años, incluso si alguien manipula el enlace.

**20. Escanear dependencias.** El escaneo encontró dos vulnerabilidades altas heredadas de Next, en las librerías de imágenes y de estilos. Agregué versiones forzadas en `package.json` para traer las corregidas sin cambiar de versión mayor. Al subir a GitHub, activa Dependabot en Settings → Security para que avise solo cuando salga algo nuevo.

---

## Qué tienes que hacer tú

1. **Ejecuta `supabase/migration-04-seguridad.sql`** en el SQL Editor. Sin esto, el hueco de privilegios sigue abierto.
2. **Corre `npm install`** para aplicar las versiones forzadas, luego `npm audit` y `npm run build`.
3. **Antes de publicar:** activa Turnstile en Authentication → Attack Protection, y vuelve a encender *Confirm email* cuando exista el servicio de correo.
4. **Al subir a GitHub:** confirma que `.env.local` no esté en la lista, y activa Dependabot.
5. **Ya en Vercel:** configura el límite de peticiones del cortafuegos.

---

## Lo que no cubre esta revisión

No es una auditoría profesional ni una prueba de penetración. Revisé el código que escribimos y la configuración de la base. No probé el sitio en ejecución buscando fallas, ni revisé la seguridad interna de Supabase, Stripe o Vercel.

Si la tienda va a manejar volumen serio, una auditoría externa antes de crecer es dinero bien gastado. Para lanzar una tienda pequeña, con los puntos de arriba resueltos, el nivel es razonable.
