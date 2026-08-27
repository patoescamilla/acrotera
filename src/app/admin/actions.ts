"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getAdminUser } from "@/lib/supabase/server";
import { pesosACentavos, slugify } from "@/lib/format";
import type { OrderStatus, ProductStatus } from "@/lib/types";

export type ActionState = { ok: boolean; message: string } | null;

/** Toda accion del panel vuelve a verificar el rol en el servidor. */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error("No tienes permiso para hacer esto.");
  return await createClient();
}

function readProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();

  return {
    name,
    slug: slugify(slugRaw || name),
    short_description: String(formData.get("short_description") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    category_id: String(formData.get("category_id") ?? "") || null,
    price_cents: pesosACentavos(String(formData.get("price") ?? "0")),
    compare_at_cents: formData.get("compare_at")
      ? pesosACentavos(String(formData.get("compare_at"))) || null
      : null,
    sku: String(formData.get("sku") ?? "").trim() || null,
    stock: Number(formData.get("stock") ?? 0) || 0,
    material: String(formData.get("material") ?? "").trim() || null,
    dimensions: String(formData.get("dimensions") ?? "").trim() || null,
    care: String(formData.get("care") ?? "").trim() || null,
    status: (String(formData.get("status") ?? "draft") as ProductStatus),
    featured: formData.get("featured") === "on",
  };
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const values = readProductForm(formData);

  if (!values.name) return { ok: false, message: "El nombre es obligatorio." };
  if (values.price_cents <= 0) return { ok: false, message: "El precio debe ser mayor a cero." };

  const { data, error } = await supabase
    .from("products")
    .insert(values)
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.code === "23505"
        ? "Ya existe un producto con esa URL. Cambia el nombre o el slug."
        : error.message,
    };
  }

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  redirect(`/admin/productos/${data.id}?nuevo=1`);
}

export async function updateProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Falta el identificador del producto." };

  const values = readProductForm(formData);
  if (!values.name) return { ok: false, message: "El nombre es obligatorio." };
  if (values.price_cents <= 0) return { ok: false, message: "El precio debe ser mayor a cero." };

  const { error } = await supabase.from("products").update(values).eq("id", id);

  if (error) {
    return {
      ok: false,
      message: error.code === "23505"
        ? "Ya existe otro producto con esa URL."
        : error.message,
    };
  }

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/tienda");
  revalidatePath(`/producto/${values.slug}`);

  return { ok: true, message: "Cambios guardados." };
}

export async function deleteProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Limpia primero los archivos del bucket para no dejar basura.
  const { data: images } = await supabase.from("product_images").select("path").eq("product_id", id);
  if (images?.length) {
    await supabase.storage.from("productos").remove(images.map((i) => i.path));
  }

  await supabase.from("products").delete().eq("id", id);

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  redirect("/admin/productos");
}

export async function attachImage(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const productId = String(formData.get("product_id") ?? "");
  const path = String(formData.get("path") ?? "");
  const alt = String(formData.get("alt") ?? "") || null;
  if (!productId || !path) return;

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  await supabase.from("product_images").insert({
    product_id: productId,
    path,
    alt,
    sort_order: count ?? 0,
  });

  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/tienda");
}

export async function deleteImage(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get("image_id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  if (!id) return;

  const { data: image } = await supabase
    .from("product_images")
    .select("path")
    .eq("id", id)
    .maybeSingle();

  if (image?.path) await supabase.storage.from("productos").remove([image.path]);
  await supabase.from("product_images").delete().eq("id", id);

  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/tienda");
}

export async function moveImage(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const productId = String(formData.get("product_id") ?? "");
  const id = String(formData.get("image_id") ?? "");
  const direction = String(formData.get("direction") ?? "up");
  if (!productId || !id) return;

  const { data: images } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .eq("product_id", productId)
    .order("sort_order");

  if (!images) return;

  const index = images.findIndex((i) => i.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= images.length) return;

  const a = images[index];
  const b = images[target];

  await supabase.from("product_images").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("product_images").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/tienda");
}

const NOMBRE_ESTADO: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  fulfilled: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export async function updateOrderStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;

  if (!id || !status) return { ok: false, message: "Falta el pedido o el estado." };

  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin");

  return { ok: true, message: `Pedido marcado como ${NOMBRE_ESTADO[status] ?? status}.` };
}

// ============================================================
//  Imágenes editables del sitio y de las categorías
// ============================================================

const RUTAS_PUBLICAS = ["/", "/interiorismo", "/nosotros", "/tienda"];

function revalidarSitio() {
  RUTAS_PUBLICAS.forEach((ruta) => revalidatePath(ruta));
  revalidatePath("/admin/portada");
}

export async function setSiteImage(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const slot = String(formData.get("slot") ?? "");
  const path = String(formData.get("path") ?? "");
  const alt = String(formData.get("alt") ?? "") || null;
  if (!slot || !path) return;

  // Si la ranura ya tenia foto, se borra del bucket para no acumular basura.
  const { data: actual } = await supabase
    .from("site_images")
    .select("path")
    .eq("slot", slot)
    .maybeSingle();

  if (actual?.path && actual.path !== path) {
    await supabase.storage.from("sitio").remove([actual.path]);
  }

  await supabase.from("site_images").update({ path, alt }).eq("slot", slot);
  revalidarSitio();
}

export async function clearSiteImage(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const slot = String(formData.get("slot") ?? "");
  if (!slot) return;

  const { data: actual } = await supabase
    .from("site_images")
    .select("path")
    .eq("slot", slot)
    .maybeSingle();

  if (actual?.path) await supabase.storage.from("sitio").remove([actual.path]);

  await supabase.from("site_images").update({ path: null, alt: null }).eq("slot", slot);
  revalidarSitio();
}

export async function setCategoryImage(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get("category_id") ?? "");
  const path = String(formData.get("path") ?? "");
  const alt = String(formData.get("alt") ?? "") || null;
  if (!id || !path) return;

  const { data: actual } = await supabase
    .from("categories")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  if (actual?.image_path && actual.image_path !== path) {
    await supabase.storage.from("sitio").remove([actual.image_path]);
  }

  await supabase.from("categories").update({ image_path: path, image_alt: alt }).eq("id", id);
  revalidarSitio();
}

export async function clearCategoryImage(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get("category_id") ?? "");
  if (!id) return;

  const { data: actual } = await supabase
    .from("categories")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  if (actual?.image_path) await supabase.storage.from("sitio").remove([actual.image_path]);

  await supabase.from("categories").update({ image_path: null, image_alt: null }).eq("id", id);
  revalidarSitio();
}

// ============================================================
//  Textos y ajustes editables
// ============================================================

export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  // La lista de ajustes se lee de la base, no del formulario:
  // asi nadie puede inventar claves nuevas desde el navegador.
  const { data: ajustes, error } = await supabase.from("site_settings").select("key, type");
  if (error || !ajustes) return { ok: false, message: "No pudimos leer los ajustes." };

  for (const ajuste of ajustes) {
    const campo = formData.get(`set_${ajuste.key}`);
    let valor: string;

    if (ajuste.type === "boolean") {
      valor = campo === "on" ? "true" : "false";
    } else if (ajuste.type === "money") {
      valor = String(pesosACentavos(String(campo ?? "0")));
    } else {
      valor = String(campo ?? "").trim();
    }

    const { error: updateError } = await supabase
      .from("site_settings")
      .update({ value: valor })
      .eq("key", ajuste.key);

    if (updateError) return { ok: false, message: updateError.message };
  }

  RUTAS_PUBLICAS.forEach((ruta) => revalidatePath(ruta));
  revalidatePath("/bolsa");
  revalidatePath("/aromas");
  revalidatePath("/admin/textos");

  return { ok: true, message: "Textos actualizados. Revisa la tienda para verlos." };
}
