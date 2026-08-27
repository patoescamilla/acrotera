import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/format";
import type { SiteSetting } from "@/lib/types";

export type Settings = Record<string, string>;

/** Valores de respaldo: si la migracion 02 aun no corre, el sitio no se cae. */
export const AJUSTES_POR_DEFECTO: Settings = {
  promo_activa: "true",
  promo_texto: "Envío sin costo en pedidos superiores a {envio}",
  promo_enlace: "",
  envio_umbral: "350000",
  envio_costo: "25000",
  hero_eyebrow: "Colección Otoño",
  hero_titulo: "El hogar se\npuede ver asi",
  hero_texto: "Muebles de líneas suaves y aromas que sostienen la memoria de un espacio.",
  hero_boton: "Ver la colección",
  hero_boton_url: "/tienda",
  contacto_email: "hola@acrotera.com",
  contacto_whatsapp: "",
  showroom_direccion: "Colima 214, Roma Norte\nCiudad de México",
  showroom_horario: "Martes a sábado, 11:00 a 19:00",
};

function aMapa(filas: SiteSetting[]): Settings {
  const mapa = { ...AJUSTES_POR_DEFECTO };
  for (const fila of filas) {
    if (fila.value !== null && fila.value !== undefined) mapa[fila.key] = fila.value;
  }
  return mapa;
}

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").order("sort_order");
  if (error || !data) return { ...AJUSTES_POR_DEFECTO };
  return aMapa(data as SiteSetting[]);
}

/** Version para rutas de API, que no tienen sesión de usuario. */
export async function getSettingsAdmin(): Promise<Settings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("site_settings").select("*").order("sort_order");
  if (error || !data) return { ...AJUSTES_POR_DEFECTO };
  return aMapa(data as SiteSetting[]);
}

export function esVerdadero(valor: string | undefined) {
  return valor === "true";
}

export function aCentavos(valor: string | undefined, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

/** Sustituye {envio} por el monto formateado, para que el letrero nunca mienta. */
export function conMontos(texto: string, umbralCentavos: number) {
  return texto.replaceAll("{envio}", money(umbralCentavos));
}

export function envioPara(subtotalCentavos: number, ajustes: Settings) {
  const umbral = aCentavos(ajustes.envio_umbral, 350000);
  const costo = aCentavos(ajustes.envio_costo, 25000);
  return subtotalCentavos >= umbral ? 0 : costo;
}
