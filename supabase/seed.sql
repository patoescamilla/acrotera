-- Datos de arranque. Ejecutar después de schema.sql.
insert into public.categories (slug, name, description, sort_order) values
  ('muebles',  'Muebles',  'Sala, comedor y descanso.',        1),
  ('aromas',   'Aromas',   'Difusores, velas y brumas.',       2),
  ('textiles', 'Textiles', 'Lino, algodón y lana.',            3)
on conflict (slug) do nothing;

insert into public.products
  (slug, name, short_description, description, category_id, price_cents, stock, material, dimensions, status, featured)
values
  ('sillon-vela', 'Sillón Vela', 'Bouclé arena',
   'Un asiento envolvente de respaldo curvo, tapizado en bouclé sobre estructura de encino y patas torneadas a mano. Producción limitada de 40 piezas.',
   (select id from public.categories where slug='muebles'), 1890000, 6,
   'Bouclé y encino macizo', '82 × 78 × 74 cm', 'active', true),
  ('mesa-anfora', 'Mesa Ánfora', 'Roble macizo',
   'Mesa de centro de base torneada en roble macizo con acabado de aceite natural.',
   (select id from public.categories where slug='muebles'), 1240000, 4,
   'Roble macizo', '110 × 60 × 42 cm', 'active', true),
  ('difusor-baie-19', 'Difusor Baie 19', 'Difusor 200 ml',
   'La energía de una tormenta seca. Enebro y bergamota en la salida, hoja de higo y musgo verde en el corazón, pachulí y ámbar en el fondo.',
   (select id from public.categories where slug='aromas'), 125000, 40,
   'Aceites esenciales y varillas de rattan', '200 ml', 'active', true),
  ('vela-cornisa', 'Vela Cornisa', 'Vela de soya 300 g',
   'Cera de soya con mecha de algodón, 55 horas de quemado.',
   (select id from public.categories where slug='aromas'), 89000, 60,
   'Cera de soya', '300 g', 'active', true)
on conflict (slug) do nothing;
