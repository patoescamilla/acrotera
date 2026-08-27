-- ============================================================
--  ACROTERA · migración 01
--  Imágenes editables del sitio (portada, interiorismo, nosotros)
--  y foto propia para cada categoría.
--
--  Ejecutar en Supabase -> SQL Editor, después de schema.sql.
--  Es seguro correrlo más de una vez.
-- ============================================================

-- ------------------------------------------------------------
-- Foto por categoría
-- ------------------------------------------------------------
alter table public.categories add column if not exists image_path text;
alter table public.categories add column if not exists image_alt  text;

-- ------------------------------------------------------------
-- Imágenes sueltas del sitio, identificadas por "ranura".
-- Cada ranura es un hueco fijo del diseño: el hero, el bloque
-- editorial, cada proyecto del portafolio, etc.
-- ------------------------------------------------------------
create table if not exists public.site_images (
  slot        text primary key,
  label       text not null,
  hint        text,
  path        text,
  alt         text,
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

drop trigger if exists site_images_touch on public.site_images;
create trigger site_images_touch before update on public.site_images
  for each row execute function public.touch_updated_at();

-- Las ranuras se registran aquí, no en el código: así el panel
-- siempre muestra exactamente los huecos que existen en el diseño.
insert into public.site_images (slot, label, hint, sort_order) values
  ('home_hero',              'Portada · imagen principal',      'Se ve a todo lo ancho, detrás del título. Horizontal, mínimo 2000 px de ancho.', 1),
  ('home_editorial',         'Portada · bloque editorial',      'Acompaña al texto "Formas y texturas que susurran calma".',                      2),
  ('interiorismo_hero',      'Interiorismo · imagen principal', 'Fondo del encabezado. Horizontal y con espacio libre al centro para el texto.',  3),
  ('interiorismo_proyecto1', 'Interiorismo · proyecto grande',  'La foto grande del portafolio.',                                                 4),
  ('interiorismo_proyecto2', 'Interiorismo · proyecto chico 1', 'Primera foto pequeña del portafolio.',                                           5),
  ('interiorismo_proyecto3', 'Interiorismo · proyecto chico 2', 'Segunda foto pequeña del portafolio.',                                           6),
  ('nosotros_retrato',       'Nosotros · taller',               'Banda horizontal debajo del manifiesto.',                                        7),
  ('nosotros_material',      'Nosotros · detalle de material',  'Acompaña al texto "Nada que no pueda repararse".',                               8)
on conflict (slot) do update
  set label = excluded.label,
      hint  = excluded.hint,
      sort_order = excluded.sort_order;

alter table public.site_images enable row level security;

drop policy if exists "imagenes del sitio publicas" on public.site_images;
create policy "imagenes del sitio publicas" on public.site_images
  for select using (true);

drop policy if exists "imagenes del sitio admin" on public.site_images;
create policy "imagenes del sitio admin" on public.site_images
  for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Bucket aparte para las fotos del sitio.
-- Se separa de 'productos' para que borrar un producto nunca
-- pueda arrastrarse una imagen de la portada.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('sitio', 'sitio', true)
on conflict (id) do nothing;

drop policy if exists "sitio lectura publica" on storage.objects;
create policy "sitio lectura publica" on storage.objects
  for select using (bucket_id = 'sitio');

drop policy if exists "sitio escritura admin" on storage.objects;
create policy "sitio escritura admin" on storage.objects
  for insert with check (bucket_id = 'sitio' and public.is_admin());

drop policy if exists "sitio borrado admin" on storage.objects;
create policy "sitio borrado admin" on storage.objects
  for delete using (bucket_id = 'sitio' and public.is_admin());
