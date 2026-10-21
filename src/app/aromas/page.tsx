import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/ui";
import { SlotImage } from "@/components/slot-image";
import { getSiteImages } from "@/lib/site-images";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const revalidate = 60;
export const metadata = { title: "Aromas" };

export default async function AromasPage() {
  const supabase = await createClient();
  const imagenes = await getSiteImages();

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "aromas")
    .maybeSingle();

  const { data } = cat
    ? await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("status", "active")
        .eq("category_id", cat.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const products = (data ?? []) as Product[];

  return (
    <div className="bg-tinta text-crema">
      <SiteHeader tone="dark" />

      <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-14">
        <div>
          <span className="eyebrow">Eau de maison</span>
          <h1 className="mt-4 font-serif text-6xl font-light leading-none text-crema">Baie 19</h1>
          <p className="mt-6 max-w-md font-serif text-lg leading-relaxed opacity-80">
            La energía de una tormenta seca. El olor de la piedra, de la tierra, del aire justo
            antes de la lluvia.
          </p>
        </div>
        <SlotImage
          image={imagenes.aromas_hero}
          fallback="bg-gradient-to-br from-[#4A3524] to-[#2C1907]"
          className="aspect-[4/3]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </section>

      <section className="border-t border-crema/14">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 md:grid-cols-3 md:px-14">
          {[
            ["Notas de salida", ["Enebro", "Bergamota", "Pimienta rosa"]],
            ["Notas de corazon", ["Hoja de higo", "Musgo verde", "Vetiver"]],
            ["Notas de fondo", ["Pachulí", "Ámbar", "Madera seca"]],
          ].map(([title, notes]) => (
            <div key={title as string}>
              <p className="eyebrow mb-3.5">{title as string}</p>
              <p className="font-serif text-lg leading-[1.9] opacity-90">
                {(notes as string[]).map((n) => (
                  <span key={n}>
                    {n}
                    <br />
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-14">
        <SectionHeading
          eyebrow="La colección"
          tone="dark"
          title={
            <>
              Tres maneras de
              <br />
              habitar el aire
            </>
          }
        />
        {products.length === 0 ? (
          <p className="py-12 text-center font-serif text-2xl opacity-50">
            La línea de aromas se publica muy pronto.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} tone="dark" />
            ))}
          </div>
        )}
      </section>

      <SiteFooter tone="tinta" />
    </div>
  );
}
