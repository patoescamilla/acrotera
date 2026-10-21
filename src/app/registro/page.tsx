import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata = { title: "Crear cuenta" };

export default async function RegistroPage() {
  if (await getSessionUser()) redirect("/cuenta");

  return (
    <main className="flex min-h-screen items-center justify-center bg-crema px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Acrotera" className="mb-10 block text-cafe">
          <span className="logotipo mx-auto h-6 w-44" />
        </Link>

        <div className="bg-hueso p-8">
          <h1 className="mb-1.5 font-serif text-2xl font-light">Crear cuenta</h1>
          <p className="mb-7 text-[13px] leading-relaxed text-humo">
            Para seguir tus pedidos y no volver a escribir tu dirección.
          </p>
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-niebla">
          No necesitas cuenta para comprar. Puedes hacerlo como invitado.
        </p>
      </div>
    </main>
  );
}
