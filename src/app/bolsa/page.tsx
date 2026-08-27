import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartView } from "@/components/cart-view";
import { createClient } from "@/lib/supabase/server";
import { getSettings, aCentavos } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tu bolsa" };

export default async function BolsaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ajustes = await getSettings();
  const envio = {
    umbral: aCentavos(ajustes.envio_umbral, 350000),
    costo: aCentavos(ajustes.envio_costo, 25000),
  };

  let defaults = { email: "", customer_name: "" };

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    defaults = {
      email: profile?.email ?? user.email ?? "",
      customer_name: profile?.full_name ?? "",
    };
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[1200px] px-5 py-12 pb-24 md:px-11">
        <h1 className="mb-3 font-serif text-4xl font-light">Tu bolsa</h1>

        {!user && (
          <p className="mb-8 text-[13px] leading-relaxed text-humo">
            Puedes comprar sin cuenta.{" "}
            <Link href="/login?redirect=/bolsa" className="text-cafe underline">
              Inicia sesion
            </Link>{" "}
            si quieres que el pedido quede guardado en tu historial.
          </p>
        )}

        <CartView defaults={defaults} envio={envio} />
      </main>

      <SiteFooter />
    </>
  );
}
