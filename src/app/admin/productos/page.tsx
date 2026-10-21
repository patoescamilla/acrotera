import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/supabase/images";
import { money } from "@/lib/format";
import { EstadoPill } from "@/components/admin/estado-pill";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(path, sort_order), categories(name, slug)")
    .order("created_at", { ascending: false });

  const products = (data ?? []) as Product[];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl font-light">Productos</h1>
        <Link href="/admin/productos/nuevo" className="label-xs border border-cafe bg-cafe px-7 py-3 text-crema">
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="border border-cafe/12 bg-crema p-12 text-center text-[13px] text-niebla">
          Aún no hay productos. Empieza creando el primero.
        </p>
      ) : (
        <div className="overflow-x-auto border border-cafe/12">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="label-xs bg-crema text-niebla">
              <tr>
                <th className="px-4 py-3">Pieza</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Inventario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const cover = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
                const src = imageUrl(cover?.path);

                return (
                  <tr key={p.id} className="border-t border-cafe/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-14 w-11 shrink-0 bg-arena">
                          {src && <Image src={src} alt="" fill sizes="44px" className="object-cover" />}
                        </div>
                        <div>
                          <p className="font-serif text-base">{p.name}</p>
                          <p className="text-[11px] text-niebla">/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-humo">{p.categories?.name ?? "Sin categoría"}</td>
                    <td className="px-4 py-3 text-cafe">{money(p.price_cents, p.currency)}</td>
                    <td className={`px-4 py-3 ${p.stock === 0 ? "text-red-800" : "text-humo"}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3"><EstadoPill status={p.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/productos/${p.id}`} className="label-xs text-cafe underline">
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
