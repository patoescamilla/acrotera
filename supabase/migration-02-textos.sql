-- ============================================================
--  ACROTERA · migración 02
--  Textos y ajustes que quien administra la tienda puede cambiar desde el panel:
--  barra de promoción, envío, hero de la portada y contacto.
--
--  Ejecutar en Supabase -> SQL Editor, después de la migración 01.
--  Es seguro correrlo más de una vez.
-- ============================================================

create table if not exists public.site_settings (
  key        text primary key,
  label      text not null,
  hint       text,
  type       text not null default 'text'
             check (type in ('text','textarea','boolean','money','url')),
  value      text,
  grupo      text not null default 'General',
  sort_order int  not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- El "value" se guarda siempre como texto y cada tipo se interpreta
-- al leerlo: 'money' son centavos, 'boolean' es 'true' o 'false'.
-- Así se agregan ajustes nuevos sin tocar el esquema.
insert into public.site_settings (key, label, hint, type, value, grupo, sort_order) values
  ('promo_activa',  'Mostrar la barra de promoción', 'Apagada, el sitio se ve más limpio y la barra pesa más cuando sí aparece.', 'boolean', 'true',
   'Barra de promoción', 1),
  ('promo_texto',   'Texto del anuncio', 'Escribe {envio} donde quieras que aparezca el monto de envío gratis; se actualiza solo.', 'text',
   'Envío sin costo en pedidos superiores a {envio}', 'Barra de promoción', 2),
  ('promo_enlace',  'Enlace (opcional)', 'Si lo llenas, la barra se vuelve clicable. Ejemplo: /tienda', 'url', '',
   'Barra de promoción', 3),

  ('envio_umbral',  'Envío gratis a partir de', 'En pesos. Se usa para cobrar y para el texto de la barra.', 'money', '350000',
   'Envío', 4),
  ('envio_costo',   'Costo de envío', 'En pesos. Lo que se cobra cuando el pedido no llega al monto de arriba.', 'money', '25000',
   'Envío', 5),

  ('hero_eyebrow',  'Portada · antetítulo', 'La línea chica de arriba. Ejemplo: Colección Otoño.', 'text', 'Colección Otoño',
   'Portada', 6),
  ('hero_titulo',   'Portada · título', 'Dos líneas funcionan mejor que tres. Presiona Enter para partirlo donde quieras.', 'textarea',
   E'El hogar se\npuede ver así', 'Portada', 7),
  ('hero_texto',    'Portada · texto de apoyo', 'Una o dos líneas bajo el título.', 'textarea',
   'Muebles de líneas suaves y aromas que sostienen la memoria de un espacio.', 'Portada', 8),
  ('hero_boton',    'Portada · texto del botón', null, 'text', 'Ver la colección', 'Portada', 9),
  ('hero_boton_url','Portada · destino del botón', 'Ejemplo: /tienda', 'url', '/tienda', 'Portada', 10),

  ('contacto_email',     'Correo de contacto', 'Aparece en el pie, en Interiorismo y en los pedidos.', 'text', 'hola@acrotera.com',
   'Contacto', 11),
  ('contacto_whatsapp',  'WhatsApp', 'Solo números, con clave de país. Ejemplo: 525512345678. Vacío lo oculta.', 'text', '',
   'Contacto', 12),
  ('showroom_direccion', 'Dirección del showroom', null, 'textarea', E'Colima 214, Roma Norte\nCiudad de México',
   'Contacto', 13),
  ('showroom_horario',   'Horarios', null, 'text', 'Martes a sábado, 11:00 a 19:00', 'Contacto', 14)
on conflict (key) do update
  set label = excluded.label,
      hint  = excluded.hint,
      type  = excluded.type,
      grupo = excluded.grupo,
      sort_order = excluded.sort_order;
      -- ojo: "value" no se toca, para no pisar lo que ya se escribió desde el panel

alter table public.site_settings enable row level security;

drop policy if exists "ajustes publicos" on public.site_settings;
create policy "ajustes publicos" on public.site_settings
  for select using (true);

drop policy if exists "ajustes admin" on public.site_settings;
create policy "ajustes admin" on public.site_settings
  for update using (public.is_admin()) with check (public.is_admin());
