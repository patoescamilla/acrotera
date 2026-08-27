import Link from "next/link";
import { RecoverForm } from "@/components/recover-form";

export const metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-crema px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Acrotera" className="mb-10 block text-cafe">
          <span className="logotipo mx-auto h-6 w-44" />
        </Link>

        <div className="bg-hueso p-8">
          <h1 className="mb-1.5 font-serif text-2xl font-light">Recuperar contraseña</h1>
          <p className="mb-7 text-[13px] leading-relaxed text-humo">
            Te mandamos un enlace para crear una nueva.
          </p>
          <RecoverForm />
        </div>
      </div>
    </main>
  );
}
