import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Acceso" };

const MENSAJES: Record<string, string> = {
  "enlace-invalido": "Ese enlace ya se uso o expiro. Pide uno nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;
  const aviso = error ? MENSAJES[error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-crema px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Acrotera" className="mb-10 block text-cafe">
          <span className="logotipo mx-auto h-6 w-44" />
        </Link>

        <div className="bg-hueso p-8">
          <h1 className="mb-1.5 font-serif text-2xl font-light">Iniciar sesión</h1>
          <p className="mb-7 text-[13px] leading-relaxed text-humo">
            Para ver tus pedidos y guardar tus datos de entrega.
          </p>

          {aviso && (
            <p className="mb-5 border border-cobre/40 bg-crema p-3 text-[11px] leading-relaxed text-cafe">
              {aviso}
            </p>
          )}

          <LoginForm redirectTo={redirect} />
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-niebla">
          No necesitas cuenta para comprar. Puedes hacerlo como invitado.
        </p>
      </div>
    </main>
  );
}
