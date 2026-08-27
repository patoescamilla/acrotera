import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { AddToCart } from "@/components/add-to-cart";
import { SectionHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/supabase/images";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, short_description")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  return { title: data?.name ?? "Producto", description: data?.short_description ?? undefined };
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), categories(id, name, slug)")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!data) notFound();
  const product = data as Product;

  const images = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const cover = imageUrl(images[0]?.path);

  const { data: relatedData } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("status", "active")
    .neq("id", product.id)
    .limit(4);
  const related = (relatedData ?? []) as Product[];

  const fichas = [
    ["Medidas y materiales", [product.dimensions, product.material].filter(Boolean).join(" · ")],
    ["Envío e instalación", "Entrega en 4 a 6 semanas. Instalación incluida en CDMX y area metropolitana. Resto del pais por paqueteria especializada."],
    ["Cuidado de la pieza", product.care],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <>
      <SiteHeader />

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-10 pb-20 md:grid-cols-[1.25fr_1fr] md:px-11">
        <div>
          <div className="relative aspect-[4/5] bg-arena">
            {cover ? (
              <Image src={cover} alt={images[0]?.alt ?? product.name} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 55vw" />
            ) : (
              <div className="label-xs flex h-full items-center justify-center text-white/70">Sin imagen</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3.5 grid grid-cols-3 gap-3.5">
              {images.slice(1, 4).map((img) => (
                <div key={img.id} className="relative aspect-square bg-arena">
                  <Image src={imageUrl(img.path)!} alt={img.alt ?? product.name} fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <p className="label-xs mb-4 text-niebla">
            Inicio / {product.categories?.name ?? "Catalogo"}
          </p>
          <h1 className="font-serif text-4xl font-light leading-tight">{product.name}</h1>

          <p className="mb-6 mt-3 font-serif text-2xl text-cafe">
            {money(product.price_cents, product.currency)}
            {product.compare_at_cents && product.compare_at_cents > product.price_cents && (
              <span className="ml-3 text-base text-niebla line-through">
                {money(product.compare_at_cents, product.currency)}
              </span>
            )}
          </p>

          {product.description && (
            <p className="mb-8 text-[13px] leading-[1.9] text-humo">{product.description}</p>
          )}

          <AddToCart product={product} />

          <div className="mt-9 text-xs text-humo">
            {fichas.map(([title, body]) => (
              <details key={title} className="border-t border-cafe/14 py-4 last:border-b">
                <summary className="label-xs flex cursor-pointer list-none items-center justify-between text-cafe">
                  {title}
                  <span className="text-sm">+</span>
                </summary>
                <p className="mt-3 leading-[1.9]">{body}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-crema px-5 py-20 md:px-11">
          <div className="mx-auto max-w-[1400px]">
            <SectionHeading eyebrow="Combina bien" title="Completa el espacio" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </>
  );
}
