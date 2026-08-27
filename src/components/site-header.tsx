import { HeaderShell, type Promo } from "@/components/header-shell";
import { getSettings, esVerdadero, aCentavos, conMontos } from "@/lib/settings";

/** Envoltura de servidor: resuelve la promocion y se la pasa al encabezado. */
export async function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const ajustes = await getSettings();

  const texto = conMontos(ajustes.promo_texto ?? "", aCentavos(ajustes.envio_umbral, 350000)).trim();
  const promo: Promo =
    esVerdadero(ajustes.promo_activa) && texto
      ? { texto, enlace: (ajustes.promo_enlace ?? "").trim() }
      : null;

  return <HeaderShell tone={tone} promo={promo} />;
}
