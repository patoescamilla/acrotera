-- ============================================================
--  ACROTERA · esquema de base de datos
--  Ejecutar completo en Supabase -> SQL Editor -> New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PERFILES  (extiende auth.users con el rol)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'customer' check (role in ('customer','admin')),
  created_at  timestamptz not null default now()
);

-- Cada usuario nuevo obtiene su perfil automáticamente, siempre como 'customer'.
-- Convertir a alguien en admin es un acto manual y deliberado (ver README).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper usado por todas las políticas. SECURITY DEFINER evita la recursión
-- infinita que ocurriría si una política de profiles consultara profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- CATÁLOGO
-- ------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  short_description text,
  description       text,
  category_id       uuid references public.categories on delete set null,
  price_cents       int  not null check (price_cents >= 0),
  compare_at_cents  int  check (compare_at_cents is null or compare_at_cents >= 0),
  currency          text not null default 'MXN',
  sku               text,
  stock             int  not null default 0 check (stock >= 0),
  material          text,
  dimensions        text,
  care              text,
  status            text not null default 'draft' check (status in ('draft','active','archived')),
  featured          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_status_idx   on public.products (status);
create index if not exists products_category_idx on public.products (category_id);

create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  path       text not null,               -- ruta dentro del bucket 'productos'
  alt        text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- PEDIDOS
-- ------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1000;

create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  order_number          text unique not null default ('ACR-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  user_id               uuid references auth.users on delete set null,
  email                 text not null,
  status                text not null default 'pending'
                        check (status in ('pending','paid','fulfilled','cancelled','refunded')),
  subtotal_cents        int not null default 0,
  shipping_cents        int not null default 0,
  total_cents           int not null default 0,
  currency              text not null default 'MXN',
  customer_name         text,
  phone                 text,
  address_line1         text,
  address_line2         text,
  city                  text,
  state                 text,
  postal_code           text,
  country               text not null default 'MX',
  notes                 text,
  stripe_session_id     text unique,
  stripe_payment_intent text,
  paid_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Los datos del producto se congelan al momento de la compra: si mañana
-- cambia el precio o el nombre, el pedido histórico no se altera.
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders on delete cascade,
  product_id     uuid references public.products on delete set null,
  name_snapshot  text not null,
  price_cents    int  not null,
  quantity       int  not null check (quantity > 0),
  image_path     text
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

-- profiles ---------------------------------------------------
drop policy if exists "perfil propio visible" on public.profiles;
create policy "perfil propio visible" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "perfil propio editable" on public.profiles;
create policy "perfil propio editable" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- OJO: esta política por sí sola NO impide que alguien se ponga rol
-- 'admin'. Eso lo cierra migration-04-seguridad.sql, revocando el
-- privilegio sobre la columna 'role' y con un disparador de respaldo.
-- No otorgues update sobre toda la tabla sin volver a leer esa migración.

-- categories -------------------------------------------------
drop policy if exists "categorias publicas" on public.categories;
create policy "categorias publicas" on public.categories for select using (true);

drop policy if exists "categorias admin" on public.categories;
create policy "categorias admin" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products ---------------------------------------------------
drop policy if exists "productos activos publicos" on public.products;
create policy "productos activos publicos" on public.products
  for select using (status = 'active' or public.is_admin());

drop policy if exists "productos admin" on public.products;
create policy "productos admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- product_images ---------------------------------------------
drop policy if exists "imagenes publicas" on public.product_images;
create policy "imagenes publicas" on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active'
    )
  );

drop policy if exists "imagenes admin" on public.product_images;
create policy "imagenes admin" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- orders -----------------------------------------------------
-- Los pedidos SOLO se crean desde el servidor con la service key,
-- que se salta RLS. Por eso aquí no hay política de insert.
drop policy if exists "pedidos propios" on public.orders;
create policy "pedidos propios" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "pedidos admin" on public.orders;
create policy "pedidos admin" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "articulos de pedidos propios" on public.order_items;
create policy "articulos de pedidos propios" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- STORAGE  (bucket de imágenes de producto)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "imagenes producto lectura publica" on storage.objects;
create policy "imagenes producto lectura publica" on storage.objects
  for select using (bucket_id = 'productos');

drop policy if exists "imagenes producto escritura admin" on storage.objects;
create policy "imagenes producto escritura admin" on storage.objects
  for insert with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "imagenes producto borrado admin" on storage.objects;
create policy "imagenes producto borrado admin" on storage.objects
  for delete using (bucket_id = 'productos' and public.is_admin());

-- ------------------------------------------------------------
-- Descuento de inventario al confirmarse el pago
-- ------------------------------------------------------------
create or replace function public.decrement_stock(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.products p
     set stock = greatest(0, p.stock - oi.quantity)
    from public.order_items oi
   where oi.order_id = p_order_id
     and oi.product_id = p.id;
end;
$$;
