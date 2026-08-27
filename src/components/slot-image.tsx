import Image from "next/image";
import { siteImageUrl } from "@/lib/supabase/images";
import type { SiteImage } from "@/lib/types";

/**
 * Hueco de imagen del sitio. Si la ranura todavía no tiene foto,
 * muestra el degradado de respaldo en vez de un espacio roto.
 */
export function SlotImage({
  image,
  fallback = "bg-arena",
  className = "",
  sizes = "100vw",
  priority = false,
  overlay,
  children,
}: {
  image?: SiteImage | null;
  fallback?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  overlay?: string;
  children?: React.ReactNode;
}) {
  const src = siteImageUrl(image?.path);

  return (
    <div className={`relative overflow-hidden ${fallback} ${className}`}>
      {src && (
        <Image
          src={src}
          alt={image?.alt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      )}
      {overlay && <div className={`absolute inset-0 ${overlay}`} />}
      {children}
    </div>
  );
}
