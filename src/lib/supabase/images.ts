export type Bucket = "productos" | "sitio";

export function imageUrl(path: string | null | undefined, bucket: Bucket = "productos") {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function siteImageUrl(path: string | null | undefined) {
  return imageUrl(path, "sitio");
}
