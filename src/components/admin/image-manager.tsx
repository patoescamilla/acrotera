"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { attachImage, deleteImage, moveImage } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { imageUrl } from "@/lib/supabase/images";
import type { ProductImage } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);

    const supabase = createClient();

    for (const file of Array.from(files)) {
      if (!TIPOS.includes(file.type)) {
        setError(`"${file.name}" no es una imagen valida. Usa JPG, PNG, WebP o AVIF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" pesa mas de 5 MB. Comprimela antes de subirla.`);
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${productId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("productos")
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) {
        setError(`No se pudo subir "${file.name}": ${uploadError.message}`);
        continue;
      }

      const form = new FormData();
      form.set("product_id", productId);
      form.set("path", path);
      form.set("alt", file.name.replace(/\.[^.]+$/, ""));
      await attachImage(form);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const ordenadas = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const busy = uploading || pending;

  return (
    <section className="border border-cafe/12 bg-crema p-6">
      <h2 className="label-xs mb-2 text-cafe">Imágenes</h2>
      <p className="mb-5 text-[12px] leading-relaxed text-humo">
        La primera imagen es la portada del producto. JPG, PNG, WebP o AVIF, hasta 5 MB cada una.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="mb-5 cursor-pointer border border-dashed border-cafe/30 bg-hueso px-6 py-10 text-center transition-colors hover:border-cafe/60"
      >
        <p className="label-xs text-cafe">
          {uploading ? "Subiendo..." : "Arrastra tus fotos aquí o haz clic"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={TIPOS.join(",")}
          multiple
          hidden
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="mb-5 border border-red-800/30 bg-red-50 p-3 text-[11px] leading-relaxed text-red-900">
          {error}
        </p>
      )}

      {ordenadas.length === 0 ? (
        <p className="text-[12px] text-niebla">Este producto todavía no tiene fotos.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ordenadas.map((img, index) => (
            <li key={img.id} className="bg-hueso">
              <div className="relative aspect-[4/5]">
                <Image
                  src={imageUrl(img.path)!}
                  alt={img.alt ?? ""}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="label-xs absolute left-2 top-2 bg-cafe px-2 py-1 text-crema">
                    Portada
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5">
                <div className="flex gap-1.5">
                  {(["up", "down"] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      disabled={busy || (dir === "up" ? index === 0 : index === ordenadas.length - 1)}
                      aria-label={dir === "up" ? "Mover antes" : "Mover despues"}
                      onClick={() => {
                        const form = new FormData();
                        form.set("product_id", productId);
                        form.set("image_id", img.id);
                        form.set("direction", dir);
                        startTransition(() => void moveImage(form));
                      }}
                      className="border border-cafe/25 px-2 py-0.5 text-xs text-cafe disabled:opacity-30"
                    >
                      {dir === "up" ? "←" : "→"}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!confirm("Eliminar esta imagen?")) return;
                    const form = new FormData();
                    form.set("product_id", productId);
                    form.set("image_id", img.id);
                    startTransition(() => void deleteImage(form));
                  }}
                  className="text-[11px] text-red-900 underline disabled:opacity-30"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
