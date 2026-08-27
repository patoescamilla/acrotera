import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PasswordForm } from "@/components/password-form";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cambiar contraseña" };

export default async function ContrasenaPage() {
  if (!(await getSessionUser())) redirect("/login?redirect=/cuenta/contrasena");

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[860px] px-5 py-12 pb-24 md:px-11">
        <Link href="/cuenta" className="label-xs text-niebla underline">
          Volver a mi cuenta
        </Link>
        <h1 className="mb-2 mt-4 font-serif text-4xl font-light">Cambiar contraseña</h1>
        <p className="mb-8 max-w-md text-[13px] leading-[1.9] text-humo">
          Elige una que no uses en otro sitio.
        </p>
        <PasswordForm />
      </main>

      <SiteFooter />
    </>
  );
}
