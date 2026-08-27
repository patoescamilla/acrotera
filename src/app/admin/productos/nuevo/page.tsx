import { ProductForm } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 font-serif text-4xl font-light">Nuevo producto</h1>
      <p className="mb-8 text-[13px] text-humo">
        Guarda la ficha primero; despues podras subir las fotos.
      </p>
      <ProductForm categories={(data ?? []) as Category[]} />
    </div>
  );
}
