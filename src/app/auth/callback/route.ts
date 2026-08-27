import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Aterrizaje de los enlaces que Supabase manda por correo
 * (confirmar cuenta, restablecer contraseña).
 * Cambia el código de un solo uso por una sesión real.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cuenta";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=enlace-invalido`);
}
