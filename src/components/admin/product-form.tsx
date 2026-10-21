"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProduct, updateProduct, deleteProduct, type ActionState } from "@/app/admin/actions";
import { Field, inputClass } from "@/components/ui";
import type { Category, Product } from "@/lib/types";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="label-xs border border-cafe bg-cafe px-8 py-3.5 text-crema transition-colors hover:bg-tinta disabled:opacity-45"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const isEdit = Boolean(product);
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-8">
        {isEdit && <input type="hidden" name="id" value={product!.id} />}

        <section className="border border-cafe/12 bg-crema p-6">
          <h2 className="label-xs mb-5 text-cafe">Información básica</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nombre de la pieza">
                <input name="name" required defaultValue={product?.name} className={inputClass} />
              </Field>
            </div>

            <Field label="URL (slug)" hint="Si lo dejas vacío se genera a partir del nombre.">
              <input name="slug" defaultValue={product?.slug} placeholder="sillon-vela" className={inputClass} />
            </Field>

            <Field label="Categoría">
              <select name="category_id" defaultValue={product?.category_id ?? ""} className={inputClass}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Descripción corta" hint="Aparece bajo el nombre en el catálogo. Una línea.">
                <input
                  name="short_description"
                  defaultValue={product?.short_description ?? ""}
                  placeholder="Bouclé arena"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Descripción completa">
                <textarea
                  name="description"
                  rows={5}
                  defaultValue={product?.description ?? ""}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="border border-cafe/12 bg-crema p-6">
          <h2 className="label-xs mb-5 text-cafe">Precio e inventario</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Precio en pesos" hint="Solo el número, sin signo.">
              <input
                name="price"
                required
                inputMode="decimal"
                defaultValue={product ? (product.price_cents / 100).toString() : ""}
                placeholder="18900"
                className={inputClass}
              />
            </Field>

            <Field label="Precio anterior" hint="Opcional. Se muestra tachado.">
              <input
                name="compare_at"
                inputMode="decimal"
                defaultValue={product?.compare_at_cents ? (product.compare_at_cents / 100).toString() : ""}
                className={inputClass}
              />
            </Field>

            <Field label="Piezas disponibles">
              <input
                name="stock"
                type="number"
                min={0}
                defaultValue={product?.stock ?? 0}
                className={inputClass}
              />
            </Field>

            <Field label="SKU">
              <input name="sku" defaultValue={product?.sku ?? ""} className={inputClass} />
            </Field>
          </div>
        </section>

        <section className="border border-cafe/12 bg-crema p-6">
          <h2 className="label-xs mb-5 text-cafe">Ficha técnica</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Materiales">
              <input
                name="material"
                defaultValue={product?.material ?? ""}
                placeholder="Bouclé y encino macizo"
                className={inputClass}
              />
            </Field>

            <Field label="Medidas">
              <input
                name="dimensions"
                defaultValue={product?.dimensions ?? ""}
                placeholder="82 x 78 x 74 cm"
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Cuidado de la pieza">
                <textarea name="care" rows={3} defaultValue={product?.care ?? ""} className={inputClass} />
              </Field>
            </div>
          </div>
        </section>

        <section className="border border-cafe/12 bg-crema p-6">
          <h2 className="label-xs mb-5 text-cafe">Publicación</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estado" hint="Solo los productos publicados se ven en la tienda.">
              <select name="status" defaultValue={product?.status ?? "draft"} className={inputClass}>
                <option value="draft">Borrador</option>
                <option value="active">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </Field>

            <label className="flex items-center gap-3 self-end pb-2.5 text-[13px]">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured}
                className="h-4 w-4 accent-[#2C1907]"
              />
              Mostrar en la portada
            </label>
          </div>
        </section>

        {state && (
          <p
            className={`p-3.5 text-[12px] leading-relaxed ${
              state.ok
                ? "border border-cafe/25 bg-crema text-cafe"
                : "border border-red-800/30 bg-red-50 text-red-900"
            }`}
          >
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Submit label={isEdit ? "Guardar cambios" : "Crear producto"} />
          <Link href="/admin/productos" className="label-xs text-niebla underline">
            Volver al listado
          </Link>
        </div>
      </form>

      {isEdit && (
        <form
          action={deleteProduct}
          className="border border-red-800/20 bg-red-50/50 p-6"
          onSubmit={(e) => {
            if (!confirm(`¿Eliminar "${product!.name}" y todas sus imágenes? Esto no se puede deshacer.`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={product!.id} />
          <h2 className="label-xs mb-2 text-red-900">Zona de riesgo</h2>
          <p className="mb-4 text-[12px] leading-relaxed text-red-900/80">
            Eliminar borra el producto y sus fotos de forma permanente. Si solo quieres quitarlo de
            la tienda, cambia su estado a Archivado.
          </p>
          <button type="submit" className="label-xs border border-red-900 px-7 py-3 text-red-900">
            Eliminar producto
          </button>
        </form>
      )}
    </div>
  );
}
