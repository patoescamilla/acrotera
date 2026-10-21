"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, inputClass } from "@/components/ui";

export function PasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

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
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setListo(true);
    setLoading(false);
    router.refresh();
  }

  if (listo) {
    return (
      <p className="border border-cafe/25 bg-crema p-3.5 text-[12px] leading-relaxed text-cafe">
        Contraseña actualizada. Ya puedes usarla la próxima vez que entres.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <Field label="Contraseña nueva" hint="Mínimo 8 caracteres.">
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>

      <Field label="Repítela">
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
        {loading ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
