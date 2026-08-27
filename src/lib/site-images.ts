import { createClient } from "@/lib/supabase/server";
import type { SiteImage } from "@/lib/types";

export type SiteImageMap = Record<string, SiteImage>;

/**
 * Lee de una sola vez todas las imágenes editables del sitio.
 * Si la migracion todavía no se ha corrido, devuelve un mapa vacío
 * y las paginas caen a sus degradados de respaldo.
 */
export async function getSiteImages(): Promise<SiteImageMap> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_images").select("*").order("sort_order");

  if (error || !data) return {};

  return Object.fromEntries((data as SiteImage[]).map((row) => [row.slot, row]));
}
