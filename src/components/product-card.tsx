import Image from "next/image";
import Link from "next/link";
import { money } from "@/lib/format";
import { imageUrl } from "@/lib/supabase/images";
import type { Product } from "@/lib/types";

export function ProductCard({ product, tone = "light" }: { product: Product; tone?: "light" | "dark" }) {
  const cover = product.product_images?.[0];
  const src = imageUrl(cover?.path);
  const dark = tone === "dark";

  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="relative mb-3.5 aspect-[4/5] overflow-hidden bg-arena">
        {src ? (
          <Image
            src={src}
            alt={cover?.alt ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="label-xs flex h-full items-center justify-center text-white/70">
            Sin imagen
          </div>
        )}
        {product.stock === 0 && (
          <span className="label-xs absolute left-3 top-3 bg-hueso px-2.5 py-1 text-cafe">
            Agotado
          </span>
        )}
      </div>
      <h3 className={`font-serif text-lg ${dark ? "text-crema" : ""}`}>{product.name}</h3>
      {product.short_description && (
        <p className={`label-xs mt-1 ${dark ? "text-crema/50" : "text-niebla"}`}>
          {product.short_description}
        </p>
      )}
      <p className={`mt-1.5 text-sm ${dark ? "text-crema" : "text-cafe"}`}>
        {money(product.price_cents, product.currency)}
      </p>
    </Link>
  );
}
