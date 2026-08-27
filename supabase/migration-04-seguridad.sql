-- ============================================================
--  ACROTERA · migración 04 — correcciones de seguridad
--
--  Ejecutar en Supabase -> SQL Editor. Es seguro correrlo más de
--  una vez. Corre esto ANTES de publicar el sitio.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ESCALADA DE PRIVILEGIOS  (grave)
--
-- La política "perfil propio editable" permitía a cualquier
-- usuario con sesión ejecutar, desde el navegador:
--
--     update profiles set role = 'admin' where id = auth.uid();
--
-- La política se cumplía (el id es el suyo) y quedaba de
-- administrador. Se cierra por dos vías independientes.
-- ------------------------------------------------------------

-- Vía 1: privilegios por columna. Nadie puede escribir en 'role'.
revoke update on public.profiles from anon, authenticated;
grant  update (full_name) on public.profiles to authenticated;

-- Vía 2: disparador, por si alguien vuelve a otorgar privilegios.
-- auth.uid() es nulo cuando la llamada viene del servidor con la
-- service key o del editor SQL, que son las vías legítimas.
create or replace function public.protege_rol()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'El rol no se puede cambiar desde la aplicación.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protege_rol on public.profiles;
create trigger profiles_protege_rol
  before update on public.profiles
  for each row execute function public.protege_rol();

-- ------------------------------------------------------------
-- 2. FUNCIÓN DE INVENTARIO EXPUESTA  (moderada)
--
-- Supabase publica como API las funciones del esquema public.
-- decrement_stock es SECURITY DEFINER, así que cualquiera podía
-- llamarla con el id de un pedido y descontar existencias a
-- voluntad. Solo el servidor debe poder invocarla.
-- ------------------------------------------------------------
revoke all on function public.decrement_stock(uuid) from public, anon, authenticated;

-- is_admin() se queda accesible a propósito: las políticas RLS la
-- evalúan con los privilegios de quien consulta, y solo revela si
-- tú mismo eres administrador.

-- ------------------------------------------------------------
-- 3. LÍMITES DE SUBIDA DEL LADO DEL SERVIDOR
--
-- El navegador ya validaba tipo y peso, pero esa comprobación se
-- brinca con una petición hecha a mano. Ahora la impone Supabase.
-- ------------------------------------------------------------
update storage.buckets
   set file_size_limit = 5242880,   -- 5 MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
 where id = 'productos';

update storage.buckets
   set file_size_limit = 8388608,   -- 8 MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
 where id = 'sitio';

-- ------------------------------------------------------------
-- 4. Comprobación
-- ------------------------------------------------------------
-- Después de correr todo, esto debe devolver 'full_name' y nada más:
--
--   select column_name from information_schema.column_privileges
--    where table_name = 'profiles' and grantee = 'authenticated'
--      and privilege_type = 'UPDATE';
