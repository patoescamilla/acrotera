import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";
import Link from "next/link";

export const revalidate = 60;
export const metadata = { title: "Catalogo" };

type Search = { categoria?: string; orden?: string };

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { categoria, orden } = await searchParams;
  const supabase = await createClient();

  const { data: catData } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  const categories = (catData ?? []) as Category[];
  const active = categories.find((c) => c.slug === categoria);

  let query = supabase
    .from("products")
    .select("*, product_images(*), categories(id, name, slug)")
    .eq("status", "active");

  if (active) query = query.eq("category_id", active.id);

  query =
    orden === "precio-asc"
      ? query.order("price_cents", { ascending: true })
      : orden === "precio-desc"
        ? query.order("price_cents", { ascending: false })
        : query.order("created_at", { ascending: false });

  const { data } = await query;
  const products = (data ?? []) as Product[];

  const ordenaciones = [
    ["Novedades", ""],
    ["Precio: menor a mayor", "precio-asc"],
    ["Precio: mayor a menor", "precio-desc"],
  ] as const;

  const buildHref = (next: Partial<Search>) => {
    const params = new URLSearchParams();
    const cat = next.categoria ?? categoria;
    const ord = next.orden ?? orden;
    if (cat) params.set("categoria", cat);
    if (ord) params.set("orden", ord);
    const qs = params.toString();
    return qs ? `/tienda?${qs}` : "/tienda";
  };

  return (
    <>
      <SiteHeader />

      <div className="border-b border-cafe/10 px-5 pb-7 pt-12 text-center md:px-11">
        <p className="label-xs mb-4 text-niebla">Inicio / {active?.name ?? "Catalogo"}</p>
        <h1 className="font-serif text-5xl font-light">{active?.name ?? "Catalogo"}</h1>
        {active?.description && (
          <p className="mx-auto mt-3.5 max-w-md text-[13px] leading-[1.9] text-humo">
            {active.description}
          </p>
        )}
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-11 px-5 py-10 pb-24 md:grid-cols-[210px_1fr] md:px-11">
        <aside>
          <p className="label-xs border-b border-cafe/18 pb-3 text-cafe">Filtrar</p>

          <div className="border-b border-cafe/10 py-5">
            <p className="label-xs mb-3">Categoría</p>
            <ul className="space-y-2 text-[13px] text-humo">
              <li>
                <Link href={buildHref({ categoria: "" })} className={!active ? "text-cafe underline" : ""}>
                  Todo
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildHref({ categoria: c.slug })}
                    className={active?.id === c.id ? "text-cafe underline" : "hover:text-cafe"}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="py-5">
            <p className="label-xs mb-3">Ordenar</p>
            <ul className="space-y-2 text-[13px] text-humo">
              {ordenaciones.map(([label, value]) => (
                <li key={label}>
                  <Link
                    href={buildHref({ orden: value })}
                    className={(orden ?? "") === value ? "text-cafe underline" : "hover:text-cafe"}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div>
          <p className="label-xs mb-6 text-niebla">
            {products.length} {products.length === 1 ? "pieza" : "piezas"}
          </p>

          {products.length === 0 ? (
            <p className="py-20 text-center font-serif text-2xl text-niebla">
              Aun no hay piezas publicadas en esta categoria.
            </p>
          ) : (
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
