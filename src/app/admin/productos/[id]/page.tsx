import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { ImageManager } from "@/components/admin/image-manager";
import { EstadoPill } from "@/components/admin/estado-pill";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const supabase = await createClient();

  const [{ data: productData }, { data: categoriesData }] = await Promise.all([
    supabase.from("products").select("*, product_images(*)").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  if (!productData) notFound();
  const product = productData as Product;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-4xl font-light">{product.name}</h1>
          <EstadoPill status={product.status} />
        </div>
        <p className="text-[13px] text-humo">
          {product.status === "active" ? (
            <Link href={`/producto/${product.slug}`} className="underline">
              Ver en la tienda
            </Link>
          ) : (
            "Este producto no es visible en la tienda todavía."
          )}
        </p>
      </div>

      {nuevo && (
        <p className="border border-cafe/25 bg-crema p-3.5 text-[12px] text-cafe">
          Producto creado. Ahora sube sus fotos y cambia el estado a Publicado cuando este listo.
        </p>
      )}

      <ImageManager productId={product.id} images={product.product_images ?? []} />

      <ProductForm product={product} categories={(categoriesData ?? []) as Category[]} />
    </div>
  );
}
