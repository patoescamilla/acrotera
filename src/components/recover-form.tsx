"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, inputClass } from "@/components/ui";

export function RecoverForm() {
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      String(form.get("email")).trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/cuenta/contrasena` },
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Se responde igual exista o no la cuenta: revelar cuáles correos
    // están registrados le sirve a quien anda tanteando.
    setEnviado(true);
    setLoading(false);
  }

  if (enviado) {
    return (
      <div>
        <p className="mb-4 text-[13px] leading-[1.9] text-humo">
          Si ese correo tiene una cuenta con nosotros, ya va en camino un enlace para crear una
          contraseña nueva.
        </p>
        <Link href="/login" className="label-xs text-cafe underline">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Correo electrónico">
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </Field>

      {error && (
        <p className="border border-red-800/30 bg-red-50 p-3 text-[11px] leading-relaxed text-red-900">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Enviando..." : "Enviar enlace"}
      </Button>

      <p className="text-center text-[11px] text-niebla">
        <Link href="/login" className="underline">
          Volver
        </Link>
      </p>
    </form>
  );
}
