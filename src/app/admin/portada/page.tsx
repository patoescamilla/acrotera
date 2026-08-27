import Link from "next/link";
import { SlotUploader } from "@/components/admin/slot-uploader";
import { createClient } from "@/lib/supabase/server";
import type { Category, SiteImage } from "@/lib/types";

export const dynamic = "force-dynamic";

const GRUPOS = [
  { titulo: "Portada", slots: ["home_hero", "home_editorial", "home_aromas"] },
  {
    titulo: "Interiorismo",
    slots: ["interiorismo_hero", "interiorismo_proyecto1", "interiorismo_proyecto2", "interiorismo_proyecto3"],
  },
  { titulo: "Aromas", slots: ["aromas_hero"] },
  { titulo: "Nosotros", slots: ["nosotros_retrato", "nosotros_material"] },
];

export default async function PortadaPage() {
  const supabase = await createClient();

  const [{ data: imagesData, error }, { data: categoriesData }] = await Promise.all([
    supabase.from("site_images").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  // La migracion de imágenes todavía no se ha corrido.
  if (error) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-4 font-serif text-4xl font-light">Portada</h1>
        <div className="border border-cobre/40 bg-crema p-6">
          <p className="mb-3 text-[13px] leading-relaxed text-humo">
            Falta un paso en la base de datos. Abre Supabase, ve al SQL Editor y ejecuta el
            archivo <code className="text-cafe">supabase/migration-01-imagenes.sql</code> del
            proyecto. Despues recarga esta pagina.
          </p>
          <p className="text-[11px] leading-relaxed text-niebla">Detalle tecnico: {error.message}</p>
        </div>
      </div>
    );
  }

  const images = (imagesData ?? []) as SiteImage[];
  const categories = (categoriesData ?? []) as Category[];
  const porSlot = new Map(images.map((i) => [i.slot, i]));

  return (
    <div className="max-w-5xl">
      <h1 className="mb-2 font-serif text-4xl font-light">Portada</h1>
      <p className="mb-9 max-w-xl text-[13px] leading-[1.9] text-humo">
        Las fotos fijas del sitio: las que no pertenecen a ningun producto. Los cambios se ven en
        la tienda de inmediato. Si dejas una vacia, esa zona muestra un fondo de color en lugar de
        quedar rota.
      </p>

      <section className="mb-11">
        <h2 className="mb-1 font-serif text-2xl font-light">Categorías</h2>
        <p className="mb-5 text-[13px] text-humo">
          Los tres bloques de la portada. Se recortan en vertical, asi que elige fotos donde el
          motivo este al centro.
        </p>

        {categories.length === 0 ? (
          <p className="border border-cafe/12 bg-crema p-6 text-[13px] text-niebla">
            No hay categorias todavia.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <SlotUploader
                key={c.id}
                target={{ kind: "category", categoryId: c.id }}
                label={c.name}
                hint={c.description}
                path={c.image_path}
                alt={c.image_alt}
                aspect="aspect-[3/4]"
              />
            ))}
          </div>
        )}
      </section>

      {GRUPOS.map((grupo) => (
        <section key={grupo.titulo} className="mb-11">
          <h2 className="mb-5 font-serif text-2xl font-light">{grupo.titulo}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {grupo.slots.map((slot) => {
              const img = porSlot.get(slot);
              if (!img) return null;
              return (
                <SlotUploader
                  key={slot}
                  target={{ kind: "slot", slot }}
                  label={img.label}
                  hint={img.hint}
                  path={img.path}
                  alt={img.alt}
                />
              );
            })}
          </div>
        </section>
      ))}

      <p className="text-[13px] text-humo">
        <Link href="/" className="underline">
          Ver la tienda
        </Link>{" "}
        para revisar como quedaron.
      </p>
    </div>
  );
}
