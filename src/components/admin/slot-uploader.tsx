"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  setSiteImage,
  clearSiteImage,
  setCategoryImage,
  clearCategoryImage,
} from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { siteImageUrl } from "@/lib/supabase/images";

const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type Target = { kind: "slot"; slot: string } | { kind: "category"; categoryId: string };

export function SlotUploader({
  target,
  label,
  hint,
  path,
  alt,
  aspect = "aspect-[16/9]",
}: {
  target: Target;
  label: string;
  hint?: string | null;
  path?: string | null;
  alt?: string | null;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const src = siteImageUrl(path);
  const busy = uploading || pending;
  const carpeta = target.kind === "slot" ? target.slot : `categoria-${target.categoryId}`;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!TIPOS.includes(file.type)) {
      setError("Usa JPG, PNG, WebP o AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen pesa más de 8 MB. Comprímela antes de subirla.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const nuevaRuta = `${carpeta}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("sitio")
      .upload(nuevaRuta, file, { cacheControl: "31536000", upsert: false });

    if (uploadError) {
      setError(`No se pudo subir: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const form = new FormData();
    form.set("path", nuevaRuta);
    form.set("alt", alt ?? label);

    if (target.kind === "slot") {
      form.set("slot", target.slot);
      await setSiteImage(form);
    } else {
      form.set("category_id", target.categoryId);
      await setCategoryImage(form);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClear() {
    if (!confirm(`Quitar la imagen de "${label}"?`)) return;
    const form = new FormData();
    if (target.kind === "slot") {
      form.set("slot", target.slot);
      startTransition(() => void clearSiteImage(form));
    } else {
      form.set("category_id", target.categoryId);
      startTransition(() => void clearCategoryImage(form));
    }
  }

  return (
    <div className="border border-cafe/12 bg-crema p-4">
      <p className="label-xs mb-1 text-cafe">{label}</p>
      {hint && <p className="mb-3 text-[11px] leading-relaxed text-niebla">{hint}</p>}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`relative ${aspect} cursor-pointer bg-hueso transition-opacity hover:opacity-90 ${
          src ? "" : "border border-dashed border-cafe/30"
        }`}
      >
        {src ? (
          <Image src={src} alt={alt ?? ""} fill sizes="400px" className="object-cover" />
        ) : (
          <span className="label-xs absolute inset-0 flex items-center justify-center text-niebla">
            {uploading ? "Subiendo..." : "Arrastra o haz clic"}
          </span>
        )}

        {src && uploading && (
          <span className="label-xs absolute inset-0 flex items-center justify-center bg-hueso/80 text-cafe">
            Subiendo...
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={TIPOS.join(",")}
          hidden
          onChange={(e) => void handleFile(e.target.files?.[0] ?? undefined)}
        />
      </div>

      {error && <p className="mt-2 text-[11px] leading-relaxed text-red-900">{error}</p>}

      <div className="mt-2.5 flex items-center justify-between">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="label-xs text-cafe underline disabled:opacity-40"
        >
          {src ? "Reemplazar" : "Subir"}
        </button>

        {src && (
          <button
            type="button"
            disabled={busy}
            onClick={handleClear}
            className="text-[11px] text-red-900 underline disabled:opacity-40"
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}
