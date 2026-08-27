import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SlotImage } from "@/components/slot-image";
import { ButtonLink } from "@/components/ui";
import { getSiteImages } from "@/lib/site-images";
import { getSettings } from "@/lib/settings";

export const revalidate = 60;
export const metadata = { title: "Nosotros" };

const PROCESO = [
  ["01", "Descubrimiento", "Empezamos con una conversacion: como vives el espacio, que conservas, que te estorba. De ahi sale el moodboard y la paleta de materiales."],
  ["02", "Diseño y producción", "Desarrollamos las piezas en taller propio con maderas certificadas y tapicerias naturales. Cada mueble se prueba antes de salir."],
  ["03", "Instalacion", "Entregamos, montamos y aromatizamos. Te dejamos una guia de cuidado para que la pieza envejezca bien."],
];

export default async function NosotrosPage() {
  const [imagenes, ajustes] = await Promise.all([getSiteImages(), getSettings()]);
  const direccion = (ajustes.showroom_direccion ?? "").split("\n").filter(Boolean);
  const mapa = `https://maps.google.com/?q=${encodeURIComponent(direccion.join(" "))}`;

  return (
    <>
      <SiteHeader />

      <section className="px-5 py-24 text-center md:px-11">
        <span className="eyebrow">Acrotera</span>
        <h1 className="mt-4 font-serif text-5xl font-light leading-[1.05] md:text-6xl">
          Lo que remata
          <br />
          una casa
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-serif text-lg leading-relaxed text-humo">
          En la arquitectura clasica, la <i>acrotera</i> es la pieza que corona el edificio: el
          ultimo gesto, el que no sostiene nada pero lo completa todo. Asi entendemos los objetos de
          la casa.
        </p>
      </section>

      <SlotImage
        image={imagenes.nosotros_retrato}
        fallback="bg-gradient-to-br from-[#B8AE9C] to-[#8E8371]"
        className="h-[380px]"
        sizes="100vw"
      />

      <section className="bg-cafe px-5 py-20 text-crema md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-12 text-center">
            <span className="eyebrow">Como trabajamos</span>
            <h2 className="mt-3.5 font-serif text-4xl font-light tracking-[0.06em] text-crema">
              EL PROCESO
            </h2>
          </div>
          <div className="grid gap-11 md:grid-cols-3">
            {PROCESO.map(([n, title, body]) => (
              <div key={n}>
                <div className="mb-2.5 font-serif text-4xl opacity-55">{n}</div>
                <p className="eyebrow mb-3.5">{title}</p>
                <p className="text-[13px] leading-[1.95] opacity-80">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <div className="px-8 py-16 md:px-14">
          <span className="eyebrow">Materiales</span>
          <h2 className="mt-3.5 font-serif text-4xl font-light leading-tight">
            Nada que no
            <br />
            pueda repararse
          </h2>
          <p className="mt-5 max-w-md text-[13px] leading-[1.9] text-humo">
            Trabajamos con maderas macizas, fibras naturales y ceras vegetales. Evitamos los
            acabados que no se pueden restaurar y los aromas de sintesis agresiva. Si una pieza se
            dana, la arreglamos.
          </p>
        </div>
        <SlotImage
          image={imagenes.nosotros_material}
          fallback="bg-gradient-to-br from-[#CFC8B6] to-[#9E9481]"
          className="aspect-[4/3] md:aspect-auto md:min-h-[420px]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </section>

      <section className="bg-crema px-5 py-20 text-center md:px-11">
        <span className="eyebrow">Visítanos</span>
        <h2 className="mt-3.5 font-serif text-4xl font-light">Showroom</h2>
        <p className="mx-auto mb-7 mt-4 max-w-xs text-[13px] leading-[1.9] text-humo">
          {direccion.map((linea) => (
            <span key={linea}>
              {linea}
              <br />
            </span>
          ))}
          {ajustes.showroom_horario}
        </p>
        <ButtonLink href={mapa}>Como llegar</ButtonLink>
      </section>

      <SiteFooter />
    </>
  );
}
