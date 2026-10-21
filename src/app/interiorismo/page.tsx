import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SlotImage } from "@/components/slot-image";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getSiteImages } from "@/lib/site-images";
import { getSettings } from "@/lib/settings";

export const revalidate = 60;
export const metadata = { title: "Interiorismo" };

const PASOS = [
  ["01", "Asesoría personalizada", "Visita al espacio, levantamiento y lectura de necesidades reales de uso."],
  ["02", "Presentación visual", "Moodboard, paleta de materiales y render de las areas principales."],
  ["03", "Cotización", "Desglose por partida, tiempos de producción y calendario de entregas."],
  ["04", "Producción", "Fabricación en taller propio y coordinación con proveedores aliados."],
  ["05", "Styling", "Montaje final, aromatización del espacio y sesión fotográfica."],
];

export default async function InteriorismoPage() {
  const [imagenes, ajustes] = await Promise.all([getSiteImages(), getSettings()]);
  const correo = `mailto:${ajustes.contacto_email}`;

  return (
    <>
      <SiteHeader />

      <SlotImage
        image={imagenes.interiorismo_hero}
        fallback="bg-gradient-to-br from-[#8A7A66] to-[#5A4632]"
        className="flex h-[420px] items-center justify-center"
        sizes="100vw"
        priority
        overlay="bg-black/35"
      >
        <div className="relative px-5 text-center text-crema">
          <span className="eyebrow text-crema/70">Servicio</span>
          <h1 className="mt-4 font-serif text-5xl font-light md:text-6xl">Interiorismo</h1>
          <p className="mx-auto mt-4 max-w-md font-serif text-lg opacity-85">
            Acompañamos el proyecto desde el primer plano hasta el último cojín.
          </p>
        </div>
      </SlotImage>

      <section className="mx-auto grid max-w-[1400px] gap-16 px-5 py-20 md:grid-cols-[1fr_1.2fr] md:px-11">
        <div>
          <span className="eyebrow">Qué incluye</span>
          <h2 className="mt-3.5 font-serif text-4xl font-light leading-tight">
            Un proceso
            <br />
            a la medida
          </h2>
          <p className="mt-5 text-[13px] leading-[1.9] text-humo">
            Trabajamos con un número limitado de proyectos al año para poder estar presentes en cada
            decisión.
          </p>
          <div className="mt-7">
            <ButtonLink href={correo}>Agendar llamada</ButtonLink>
          </div>
        </div>

        <div>
          {PASOS.map(([n, title, body]) => (
            <div key={n} className="grid grid-cols-[44px_1fr] border-t border-cafe/14 py-6 last:border-b">
              <span className="font-serif text-base text-cobre">{n}</span>
              <div>
                <h3 className="mb-1.5 font-serif text-xl">{title}</h3>
                <p className="text-[13px] leading-[1.9] text-humo">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-crema px-5 py-20 md:px-11">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading eyebrow="Portafolio" title="Proyectos recientes" />
          <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
            <SlotImage
              image={imagenes.interiorismo_proyecto1}
              fallback="bg-gradient-to-br from-[#B8AE9C] to-[#8E8371]"
              className="aspect-[4/3]"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
            <div className="grid gap-5">
              <SlotImage
                image={imagenes.interiorismo_proyecto2}
                fallback="bg-gradient-to-br from-[#8A7A66] to-[#5A4632]"
                className="aspect-[16/9]"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <SlotImage
                image={imagenes.interiorismo_proyecto3}
                fallback="bg-gradient-to-br from-[#D6D1C3] to-[#B0A895]"
                className="aspect-[16/9]"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cafe px-5 py-20 text-center text-crema md:px-11">
        <span className="eyebrow">Empecemos</span>
        <h2 className="mt-3.5 font-serif text-4xl font-light leading-tight text-crema">
          ¿Tienes un espacio
          <br />
          en mente?
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-[13px] leading-[1.9] opacity-75">
          Cuéntanos del proyecto y te respondemos en menos de 48 horas.
        </p>
        <div className="mt-7">
          <ButtonLink href={correo} tone="light">
            Agendar asesoría
          </ButtonLink>
        </div>
      </section>

      <SiteFooter tone="tinta" />
    </>
  );
}
