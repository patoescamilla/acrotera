import Link from "next/link";
import { getSettings } from "@/lib/settings";

const COLUMNS = [
  {
    title: "Tienda",
    links: [
      ["Muebles", "/tienda?categoria=muebles"],
      ["Aromas", "/aromas"],
      ["Textiles", "/tienda?categoria=textiles"],
      ["Todo el catálogo", "/tienda"],
    ],
  },
  {
    title: "Servicio",
    links: [
      ["Envios y entregas", "/nosotros"],
      ["Cambios y devoluciones", "/nosotros"],
      ["Cuidado de piezas", "/nosotros"],
      ["Interiorismo", "/interiorismo"],
    ],
  },
  {
    title: "Acrotera",
    links: [
      ["Nosotros", "/nosotros"],
      ["Showroom", "/nosotros"],
      ["Mi cuenta", "/cuenta"],
    ],
  },
] as const;

export async function SiteFooter({ tone = "cafe" }: { tone?: "cafe" | "tinta" }) {
  const ajustes = await getSettings();
  const direccion = (ajustes.showroom_direccion ?? "").split("\n").filter(Boolean);
  const whatsapp = (ajustes.contacto_whatsapp ?? "").replace(/\D/g, "");

  return (
    <footer className={`${tone === "cafe" ? "bg-cafe" : "bg-tinta"} text-crema`}>
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-11">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <span className="logotipo mb-5 h-[18px] w-[128px]" />
            <p className="max-w-[250px] text-xs leading-relaxed opacity-70">
              Muebles y aromas para la casa.
              {direccion.map((linea) => (
                <span key={linea}>
                  <br />
                  {linea}
                </span>
              ))}
            </p>
            <p className="mt-4 text-xs leading-relaxed opacity-70">
              <a href={`mailto:${ajustes.contacto_email}`} className="hover:opacity-60">
                {ajustes.contacto_email}
              </a>
              {whatsapp && (
                <>
                  <br />
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    className="hover:opacity-60"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </>
              )}
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="label-xs mb-4 opacity-70">{col.title}</h4>
              <ul className="space-y-2 text-xs opacity-85">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="transition-opacity hover:opacity-60">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="label-xs mt-12 flex flex-col gap-2 border-t border-crema/18 pt-5 opacity-55 sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Acrotera</span>
          <span>Aviso de privacidad &middot; Terminos</span>
        </div>
      </div>
    </footer>
  );
}
