import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role: se salta RLS por completo.
 * Úsalo solo en route handlers y server actions, jamás en componentes cliente.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
