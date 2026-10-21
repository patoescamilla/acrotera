import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const next = String(form?.get("next") ?? "/");

  const supabase = await createClient();
  await supabase.auth.signOut();

  // Solo rutas internas: evita que un formulario ajeno nos use de trampolín.
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(new URL(destino, request.url), { status: 303 });
}
