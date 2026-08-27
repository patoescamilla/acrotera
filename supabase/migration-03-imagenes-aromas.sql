-- ============================================================
--  ACROTERA · migración 03
--  Dos huecos de imagen que faltaban: el bloque de aromas de la
--  portada y el bodegón de la página de Aromas.
--
--  Ejecutar en Supabase -> SQL Editor, después de la migración 02.
--  Es seguro correrlo más de una vez.
-- ============================================================

insert into public.site_images (slot, label, hint, sort_order) values
  ('home_aromas',  'Portada · bloque de aromas',   'Acompaña al texto "Naturaleza sin filtro". Fondo oscuro, funciona bien un bodegón.', 9),
  ('aromas_hero',  'Aromas · bodegón principal',   'La foto grande junto al nombre del aroma, arriba de la página de Aromas.',          10)
on conflict (slot) do update
  set label = excluded.label,
      hint  = excluded.hint,
      sort_order = excluded.sort_order;
