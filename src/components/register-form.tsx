"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, inputClass } from "@/components/ui";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisaCorreo, setRevisaCorreo] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));

    if (password.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    if (password !== String(form.get("password2"))) {
      setError("Las dos contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email: String(form.get("email")).trim().toLowerCase(),
      password,
      options: {
        data: { full_name: String(form.get("full_name")).trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/cuenta`,
      },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Ya existe una cuenta con ese correo. Inicia sesión."
          : authError.message,
      );
      setLoading(false);
      return;
    }

    // Si Supabase pide confirmar el correo, no devuelve sesión todavía.
    if (!data.session) {
      setRevisaCorreo(true);
      setLoading(false);
      return;
    }

    router.push("/cuenta");
    router.refresh();
  }

  if (revisaCorreo) {
    return (
      <div>
        <p className="mb-4 text-[13px] leading-[1.9] text-humo">
          Te mandamos un correo para confirmar tu cuenta. Abre el enlace y quedas dentro.
        </p>
        <p className="text-[11px] leading-relaxed text-niebla">
          Si no llega en unos minutos, revisa la carpeta de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nombre completo">
        <input name="full_name" required autoComplete="name" className={inputClass} />
      </Field>

      <Field label="Correo electrónico">
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </Field>

      <Field label="Contraseña" hint="Mínimo 8 caracteres.">
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>

      <Field label="Repite la contraseña">
        <input
          type="password"
          name="password2"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="border border-red-800/30 bg-red-50 p-3 text-[11px] leading-relaxed text-red-900">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-[11px] text-niebla">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
