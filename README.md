# ACROTERA · tienda en línea

Next.js 15 (App Router) + Supabase (auth, Postgres, storage) + Stripe Checkout.

Incluye tienda pública, panel de administración con alta/edición/borrado de productos y subida de imágenes, carrito persistente, cobro con tarjeta y OXXO, y registro de pedidos.

---

## 1. Instalar

Necesitas Node 20 o superior.

```bash
npm install
cp .env.example .env.local
```

> Si la carpeta `node_modules` ya venía a medias en la entrega, `npm install` la completa sola. Si prefieres empezar limpio, bórrala antes.

---

## 2. Supabase

1. Crea un proyecto gratis en [supabase.com](https://supabase.com). Elige la región `East US` o `West US` (las más cercanas a México con buena latencia).
2. Ve a **SQL Editor → New query**, pega **todo** el contenido de `supabase/schema.sql` y ejecútalo. Esto crea las tablas, las políticas de seguridad y el bucket de imágenes.
3. Ejecuta las migraciones en orden:
   - `supabase/migration-01-imagenes.sql` — sección **Portada** del panel: las fotos del sitio que no pertenecen a ningún producto.
   - `supabase/migration-02-textos.sql` — sección **Textos**: barra de promoción, titular de la portada, envío y contacto.

   Todas son seguras de correr más de una vez.
4. Opcional: ejecuta `supabase/seed.sql` para tener cuatro productos de ejemplo.
5. Ve a **Project Settings → API** y copia a tu `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

La `service_role` se salta todas las reglas de seguridad. Va solo en el servidor: nunca en un componente cliente, nunca en git, nunca en un mensaje de WhatsApp.

### Crear la cuenta de la clienta

1. **Authentication → Users → Add user**. Correo y contraseña, marca *Auto Confirm User*.
2. Vuelve al **SQL Editor** y conviértela en administradora:

```sql
update public.profiles
   set role = 'admin'
 where email = 'correo-de-la-clienta@ejemplo.com';
```

Todo usuario nuevo nace como `customer`. Volverse `admin` es un acto manual y deliberado: nadie puede escalar su propio rol desde la aplicación.

---

## 3. Stripe

1. Crea la cuenta en [stripe.com](https://stripe.com) y actívala con los datos fiscales del negocio (RFC, cuenta CLABE).
2. Trabaja primero en **modo prueba**. En **Developers → API keys** copia:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`
3. Webhook en local:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copia el `whsec_...` que imprime a `STRIPE_WEBHOOK_SECRET`.

4. Webhook en producción: **Developers → Webhooks → Add endpoint**, apuntando a `https://tudominio.com/api/webhooks/stripe`, con estos eventos:

   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`

5. Para cobrar en OXXO: actívalo en **Settings → Payment methods** y pon `STRIPE_ENABLE_OXXO=true`.

Tarjetas de prueba: `4242 4242 4242 4242`, cualquier fecha futura, cualquier CVC.

---

## 4. Correr

```bash
npm run dev
```

- Tienda: <http://localhost:3000>
- Panel: <http://localhost:3000/admin>

---

## 5. Publicar

Vercel es el camino natural para Next.js:

1. Sube el proyecto a GitHub.
2. En Vercel, **Add New → Project**, importa el repo.
3. Copia todas las variables de `.env.local` en **Settings → Environment Variables**, cambiando `NEXT_PUBLIC_SITE_URL` por el dominio real.
4. En Supabase, **Authentication → URL Configuration**, agrega el dominio a *Site URL* y *Redirect URLs*.
5. Cambia las llaves de Stripe a las de producción (`sk_live_`, `pk_live_`) y crea el webhook de producción.

---

## Cómo está armado

```
src/
  app/
    page.tsx                     Portada
    tienda/                      Catálogo con filtros por categoría y orden
    producto/[slug]/             Ficha de producto
    aromas/                      Landing de la línea de aromas
    interiorismo/  nosotros/     Páginas de contenido
    bolsa/                       Carrito y datos de entrega
    pedido/exito/                Confirmación tras el pago
    login/  registro/            Acceso y alta de clientes
    recuperar/                   Restablecer contraseña
    cuenta/                      Mis pedidos, detalle y cambio de contraseña
    admin/
      page.tsx                   Resumen con métricas
      productos/                 Listado, alta y edición
      portada/                   Imágenes fijas del sitio y de las categorías
      textos/                    Promoción, hero, envío y contacto
      pedidos/                   Listado y detalle
      actions.ts                 Server actions (todas revalidan el rol)
    api/
      checkout/                  Crea la sesión de pago
      webhooks/stripe/           Confirma el pago y descuenta inventario
    auth/callback/               Canjea los enlaces que Supabase manda por correo
    auth/signout/                Cierre de sesión
  components/                    Cabecera, pie, tarjetas, carrito, formularios
  lib/
    supabase/                    Clientes de navegador, servidor y service role
    stripe.ts                    Instancia de Stripe y cálculo de envío
  middleware.ts                  Refresca la sesión y blinda /admin
supabase/
  schema.sql                     Tablas, RLS, storage, función de inventario
  seed.sql                       Datos de ejemplo
```

### Decisiones de seguridad que conviene no deshacer

**Los precios nunca vienen del navegador.** `/api/checkout` recibe solo el id del producto y la cantidad; el precio, el estado y el inventario se releen de la base antes de armar la sesión de Stripe. Si alguien edita el carrito desde la consola del navegador, no cambia nada.

**El pedido se marca como pagado solo desde el webhook**, y solo después de verificar la firma con `STRIPE_WEBHOOK_SECRET`. La página de éxito no confirma nada: únicamente muestra lo que ya pasó.

**El webhook es idempotente.** Stripe reintenta los eventos; si un pedido ya está pagado, no se vuelve a descontar inventario.

**RLS activo en todas las tablas.** Un visitante solo ve productos con estado `active`. Los pedidos solo los ve su dueño o un admin. Los pedidos se insertan exclusivamente con la service key desde el servidor.

**El rol se verifica dos veces**: en el middleware, antes de renderizar `/admin`, y otra vez dentro de cada server action. El middleware por sí solo no basta como frontera de seguridad.

---

## Uso diario del panel

**Agregar un producto:** Productos → Nuevo producto → llena la ficha → Crear. La pieza nace como borrador. Después subes las fotos arrastrándolas al recuadro (la primera es la portada; se reordena con las flechas) y cambias el estado a *Publicado*.

**Marcar un pedido como entregado:** Pedidos → abre el pedido → Cambiar estado → Entregado.

**Cambiar el anuncio de arriba, el titular de la portada o el monto de envío gratis:** Textos. El monto de envío es una sola fuente de verdad: alimenta el cobro, el resumen del carrito y el letrero, así que no pueden contradecirse. En el texto del anuncio puedes escribir `{envio}` y se sustituye solo por el monto vigente.

**Cambiar las fotos grandes del sitio:** Portada. Ahí están el hero, los tres bloques de categoría, las imágenes de Interiorismo y las de Nosotros. Cada hueco explica para qué sirve. Si dejas uno vacío, esa zona muestra un fondo de color en vez de romperse.

**Quitar algo de la tienda sin perder el historial:** cambia el estado a *Archivado* en lugar de eliminar. Eliminar borra el producto y sus fotos para siempre.

---

## Pendientes conocidos

Cosas que la tienda todavía no hace y que valdría la pena agregar según cómo evolucione el negocio:

- Correos transaccionales: confirmación de compra, y SMTP propio para que el "olvidé mi contraseña" funcione con volumen real. Requiere dominio verificado.
- Cálculo de envío por código postal; hoy es tarifa plana con umbral de envío gratis.
- Variantes de producto (color o material como opciones con inventario propio). Hoy cada variante sería un producto distinto.
- Facturación CFDI.
- Búsqueda de texto en el catálogo.
