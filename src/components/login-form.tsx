"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, inputClass } from "@/components/ui";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim().toLowerCase(),
      password: String(form.get("password")),
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : authError.message === "Email not confirmed"
            ? "Falta confirmar tu correo. Busca el mensaje que te mandamos."
            : authError.message,
      );
      setLoading(false);
      return;
    }

    // Sin destino explícito, cada quien aterriza donde le toca.
    let destino = redirectTo;
    if (!destino) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      destino = profile?.role === "admin" ? "/admin" : "/cuenta";
    }

    router.push(destino);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Correo electrónico">
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </Field>

      <Field label="Contraseña">
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="border border-red-800/30 bg-red-50 p-3 text-[11px] leading-relaxed text-red-900">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="flex justify-between text-[11px] text-niebla">
        <Link href="/recuperar" className="underline">
          Olvidé mi contraseña
        </Link>
        <Link href="/registro" className="underline">
          Crear cuenta
        </Link>
      </div>
    </form>
  );
}
