# Acrotera

Tienda en línea de muebles, textiles y aromas, con panel de administración. La construí con Next.js 15 (App Router), Supabase y Stripe Checkout.

## Qué hace

**Tienda**
- Catálogo con filtro por categoría y orden, y ficha de producto con galería.
- Carrito guardado en el navegador (`localStorage`).
- Pago con tarjeta mediante Stripe Checkout, y OXXO opcional.
- Compra como invitado o con cuenta. Con cuenta: historial de pedidos, detalle de cada pedido y cambio de contraseña.
- Registro, inicio de sesión y recuperación de contraseña con Supabase Auth.

**Panel de administración (`/admin`)**
- Resumen: productos publicados, borradores, productos sin existencia, pedidos por enviar y ventas confirmadas.
- Alta, edición y borrado de productos, con estados borrador, publicado y archivado.
- Subida y orden de fotos por producto.
- Imágenes fijas del sitio (portada, categorías, páginas de contenido) editables por ranura.
- Textos editables: barra de promoción, portada, costo de envío, umbral de envío gratis y datos de contacto.
- Listado de pedidos y cambio de estado.

## Stack

- Next.js 15.5 (App Router, Server Components, Server Actions, Route Handlers)
- React 19 y TypeScript
- Tailwind CSS 4
- Supabase: Auth, Postgres con Row Level Security y Storage
- Stripe Checkout y webhooks
- Netlify para el despliegue

## Decisiones técnicas

- **El precio se calcula en el servidor.** `/api/checkout` recibe solo el id del producto y la cantidad. Precio, estado e inventario se leen de la base antes de crear la sesión de Stripe. La entrada se valida: formato de ids, máximo de líneas y piezas, y largo de cada campo.
- **Un pedido se marca como pagado solo desde el webhook**, después de verificar la firma de Stripe. Si el pedido ya estaba pagado, no se vuelve a descontar inventario. La página de éxito solo muestra el estado, no lo cambia.
- **Los pedidos guardan una copia del producto.** `order_items` guarda nombre y precio al momento de la compra, así que editar un producto no altera pedidos anteriores.
- **RLS en todas las tablas.** Un visitante solo ve productos publicados y un cliente solo ve sus pedidos. Los pedidos solo se crean desde el servidor con la service role.
- **El rol de administrador se verifica en tres capas**: el middleware protege `/admin`, cada server action vuelve a revisar el rol y las políticas de RLS niegan el acceso aunque las dos anteriores fallen. La columna `role` no se puede modificar desde el navegador (privilegios por columna y un trigger, en `migration-04-seguridad.sql`).
- **La service role solo existe en el servidor.** El cliente que la usa importa `server-only`, así que la compilación falla si alguien lo usa en un componente de navegador.

Más detalle en [SEGURIDAD.md](SEGURIDAD.md).

## Capturas

<!-- Pendiente: agregar capturas de la tienda y del panel. -->

## Correr en local

Necesitas Node 22 (está en `.nvmrc`), una cuenta de Supabase y una de Stripe en modo prueba. Las dos son gratis.

```bash
npm install
cp .env.example .env.local
```

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta estos archivos en orden. Todos se pueden correr más de una vez.
   - `supabase/schema.sql`: tablas, políticas RLS, bucket de imágenes y función de inventario.
   - `supabase/migration-01-imagenes.sql`: imágenes fijas del sitio.
   - `supabase/migration-02-textos.sql`: textos y ajustes editables.
   - `supabase/migration-03-imagenes-aromas.sql`: dos ranuras de imagen para la sección de aromas.
   - `supabase/migration-04-seguridad.sql`: protege la columna `role`, restringe `decrement_stock` al servidor y limita tipo y peso de las imágenes. **No la omitas.**
   - Opcional: `supabase/seed.sql`, con cuatro productos de ejemplo.
3. En **Project Settings → API**, copia a `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; nunca la subas a git)

### 2. Usuario administrador

Todo usuario nuevo se crea con rol `customer`. Para entrar al panel:

1. En **Authentication → Users → Add user**, crea un usuario con *Auto Confirm User*.
2. En el **SQL Editor**:

```sql
update public.profiles
   set role = 'admin'
 where email = 'tu-correo@ejemplo.com';
```

### 3. Stripe

1. En **Developers → API keys** (modo prueba), copia:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`
2. Reenvía los webhooks a tu máquina con la [CLI de Stripe](https://docs.stripe.com/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

   Copia el `whsec_...` que imprime a `STRIPE_WEBHOOK_SECRET`.

3. OXXO es opcional: actívalo en **Settings → Payment methods** de Stripe y pon `STRIPE_ENABLE_OXXO=true`.

Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.

### 4. Levantar

```bash
npm run dev
```

- Tienda: <http://localhost:3000>
- Panel: <http://localhost:3000/admin>

`npm run typecheck` revisa los tipos sin compilar.

## Despliegue en Netlify

`netlify.toml` ya fija el comando de build, la carpeta de salida y Node 22.

1. En Netlify, importa el repositorio desde GitHub.
2. En **Site configuration → Environment variables**, agrega las variables de `.env.example` con `NEXT_PUBLIC_SITE_URL` apuntando al dominio real.
3. En Supabase, **Authentication → URL Configuration**: agrega el dominio a *Site URL* y *Redirect URLs*.
4. En Stripe, usa las llaves de producción y crea un webhook hacia `https://tu-dominio/api/webhooks/stripe` con estos eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`

## Estructura

```
src/
  app/
    page.tsx                     Portada
    tienda/                      Catálogo con filtros por categoría y orden
    producto/[slug]/             Ficha de producto
    aromas/                      Página de la línea de aromas
    interiorismo/  nosotros/     Páginas de contenido
    bolsa/                       Carrito y datos de entrega
    pedido/exito/                Confirmación después del pago
    login/  registro/            Acceso y alta de clientes
    recuperar/                   Restablecer contraseña
    cuenta/                      Pedidos del cliente y cambio de contraseña
    admin/
      page.tsx                   Resumen
      productos/                 Listado, alta y edición
      portada/                   Imágenes fijas del sitio y de las categorías
      textos/                    Promoción, portada, envío y contacto
      pedidos/                   Listado y detalle
      actions.ts                 Server actions (todas revalidan el rol)
    api/
      checkout/                  Crea el pedido y la sesión de Stripe
      webhooks/stripe/           Confirma el pago y descuenta inventario
    auth/callback/               Canjea los enlaces que Supabase manda por correo
    auth/signout/                Cierre de sesión
  components/                    Cabecera, pie, tarjetas, carrito, formularios
  lib/
    supabase/                    Clientes de navegador, servidor y service role
    stripe.ts                    Cliente de Stripe
    settings.ts                  Ajustes editables y cálculo de envío
    site-images.ts               Imágenes fijas del sitio
  middleware.ts                  Refresca la sesión y protege /admin
supabase/
  schema.sql                     Tablas, RLS, storage, función de inventario
  migration-01 … 04              Migraciones, en orden
  seed.sql                       Datos de ejemplo
docs/
  ADMIN.md                       Uso del panel de administración
```

## Pendientes

- Correos transaccionales (confirmación de compra) y SMTP propio para la recuperación de contraseña.
- Envío por código postal. Hoy es tarifa plana con umbral de envío gratis.
- Variantes de producto con inventario propio.
- Facturación CFDI.
- Búsqueda en el catálogo.

## Licencia

MIT. Ver [LICENSE](LICENSE).
