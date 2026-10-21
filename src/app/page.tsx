import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { SlotImage } from "@/components/slot-image";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getSiteImages } from "@/lib/site-images";
import { getSettings } from "@/lib/settings";
import { siteImageUrl } from "@/lib/supabase/images";
import type { Category, Product } from "@/lib/types";

export const revalidate = 60;

/** Las categorías de aromas tienen página propia; el resto va al catálogo filtrado. */
function hrefDeCategoria(slug: string) {
  return slug === "aromas" ? "/aromas" : `/tienda?categoria=${slug}`;
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: featuredData }, { data: categoriesData }, imagenes] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("status", "active")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("categories").select("*").order("sort_order"),
    getSiteImages(),
  ]);

  const ajustes = await getSettings();

  const featured = (featuredData ?? []) as Product[];
  const categories = (categoriesData ?? []) as Category[];

  return (
    <>
      <SiteHeader />

      <SlotImage
        image={imagenes.home_hero}
        fallback="bg-gradient-to-br from-[#6E5B48] to-[#2C1907]"
        className="h-[560px]"
        sizes="100vw"
        priority
        overlay="bg-gradient-to-r from-black/55 to-transparent"
      >
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-16 md:px-16">
          {ajustes.hero_eyebrow && (
            <span className="eyebrow text-crema/75">{ajustes.hero_eyebrow}</span>
          )}
          <h1 className="mt-4 max-w-xl whitespace-pre-line font-serif text-5xl font-light leading-[1.02] text-crema md:text-6xl">
            {ajustes.hero_titulo}
          </h1>
          {ajustes.hero_texto && (
            <p className="mt-5 max-w-md whitespace-pre-line font-serif text-lg leading-relaxed text-crema/85">
              {ajustes.hero_texto}
            </p>
          )}
          {ajustes.hero_boton && (
            <div className="mt-7">
              <ButtonLink href={ajustes.hero_boton_url || "/tienda"} tone="light">
                {ajustes.hero_boton}
              </ButtonLink>
            </div>
          )}
        </div>
      </SlotImage>

      {categories.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-14 md:px-11">
          <div className="grid gap-5 md:grid-cols-3">
            {categories.map((c) => {
              const src = siteImageUrl(c.image_path);
              return (
                <Link key={c.id} href={hrefDeCategoria(c.slug)} className="group block">
                  <div className="relative mb-3.5 aspect-[3/4] overflow-hidden bg-arena">
                    {src && (
                      <Image
                        src={src}
                        alt={c.image_alt ?? c.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <h3 className="font-serif text-lg">{c.name}</h3>
                  {c.description && <p className="label-xs mt-1 text-niebla">{c.description}</p>}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid bg-crema md:grid-cols-2">
        <SlotImage
          image={imagenes.home_editorial}
          fallback="bg-gradient-to-br from-[#B8AE9C] to-[#8E8371]"
          className="aspect-[4/3] md:aspect-auto md:min-h-[460px]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="px-8 py-16 md:px-14">
          <span className="eyebrow">Nuestra idea</span>
          <h2 className="mt-3.5 font-serif text-4xl font-light leading-tight">
            Formas y texturas
            <br />
            que susurran calma
          </h2>
          <p className="mt-5 max-w-md text-[13px] leading-[1.9] text-humo">
            Cada pieza se elige por cómo se comporta con el tiempo: la madera que se oscurece, el
            lino que se ablanda, el aroma que se vuelve familiar. No diseñamos escenarios,
            diseñamos rutinas.
          </p>
          <div className="mt-7">
            <ButtonLink href="/nosotros">Conocer Acrotera</ButtonLink>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-11">
          <SectionHeading eyebrow="Selección" title="Lo más buscado" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-tinta text-crema">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 py-20 md:grid-cols-2 md:px-11">
          <SlotImage
            image={imagenes.home_aromas}
            fallback="bg-gradient-to-br from-[#4A3524] to-[#2C1907]"
            className="aspect-[4/3]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div>
            <span className="eyebrow">La línea de aromas</span>
            <h2 className="mt-3.5 font-serif text-4xl font-light leading-tight text-crema">
              Naturaleza
              <br />
              sin filtro
            </h2>
            <p className="mt-4 max-w-sm text-[13px] leading-[1.9] opacity-70">
              Tres composiciones desarrolladas en México, pensadas para habitarse todo el día.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[
                ["Salida", "Enebro", "Bergamota"],
                ["Corazón", "Higo", "Musgo verde"],
                ["Fondo", "Pachulí", "Ámbar"],
              ].map(([title, a, b]) => (
                <div key={title}>
                  <div className="eyebrow mb-2">{title}</div>
                  <div className="font-serif text-base leading-relaxed opacity-90">
                    {a}
                    <br />
                    {b}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <ButtonLink href="/aromas" tone="light">
                Descubrir aromas
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
