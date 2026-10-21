"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { Button, Field, inputClass } from "@/components/ui";
import { imageUrl } from "@/lib/supabase/images";
import { money } from "@/lib/format";

const ESTADOS = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua",
  "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato",
  "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco",
  "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

export type CheckoutDefaults = { email: string; customer_name: string };
export type EnvioConfig = { umbral: number; costo: number };

export function CartView({
  defaults,
  envio: config,
}: {
  defaults?: CheckoutDefaults;
  envio: EnvioConfig;
}) {
  const { lines, ready, subtotalCents, setQuantity, remove } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const envio = subtotalCents >= config.umbral ? 0 : config.costo;
  const total = subtotalCents + envio;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      customer: Object.fromEntries(form.entries()),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "No pudimos iniciar el pago.");

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setLoading(false);
    }
  }

  if (!ready) return <p className="py-20 text-center text-sm text-niebla">Cargando tu bolsa...</p>;

  if (lines.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-2xl text-niebla">Tu bolsa está vacía.</p>
        <Link href="/tienda" className="label-xs mt-6 inline-block border border-cafe px-8 py-3.5 text-cafe">
          Ver el catalogo
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1fr_340px]">
      <div>
        {lines.map((line) => {
          const src = imageUrl(line.image);
          return (
            <div
              key={line.productId}
              className="grid grid-cols-[88px_1fr_auto] items-start gap-5 border-t border-cafe/14 py-5 last:border-b"
            >
              <div className="relative aspect-[4/5] bg-arena">
                {src && <Image src={src} alt={line.name} fill sizes="88px" className="object-cover" />}
              </div>

              <div>
                <Link href={`/producto/${line.slug}`} className="font-serif text-lg hover:underline">
                  {line.name}
                </Link>
                <p className="label-xs mb-3 mt-1 text-niebla">{money(line.priceCents)} c/u</p>

                <div className="inline-flex items-center gap-4 border border-cafe/22 px-3 py-1.5 text-sm">
                  <button type="button" aria-label="Quitar uno" onClick={() => setQuantity(line.productId, line.quantity - 1)}>−</button>
                  <span>{line.quantity}</span>
                  <button type="button" aria-label="Agregar uno" onClick={() => setQuantity(line.productId, line.quantity + 1)}>+</button>
                </div>

                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  className="mt-3 block text-[11px] text-niebla underline"
                >
                  Eliminar
                </button>
              </div>

              <p className="text-sm text-cafe">{money(line.priceCents * line.quantity)}</p>
            </div>
          );
        })}

        <fieldset className="mt-10">
          <legend className="label-xs mb-5 text-cafe">Datos de entrega</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo">
              <input
                name="customer_name"
                required
                defaultValue={defaults?.customer_name}
                className={inputClass}
              />
            </Field>
            <Field label="Correo electrónico">
              <input
                type="email"
                name="email"
                required
                defaultValue={defaults?.email}
                className={inputClass}
              />
            </Field>
            <Field label="Teléfono">
              <input name="phone" required className={inputClass} />
            </Field>
            <Field label="Código postal">
              <input name="postal_code" required inputMode="numeric" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Calle y número">
                <input name="address_line1" required className={inputClass} />
              </Field>
            </div>
            <Field label="Colonia">
              <input name="address_line2" className={inputClass} />
            </Field>
            <Field label="Ciudad">
              <input name="city" required className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Estado">
                <select name="state" required defaultValue="" className={inputClass}>
                  <option value="" disabled>Selecciona</option>
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notas para la entrega" hint="Opcional: referencias, horarios, instrucciones de acceso.">
                <textarea name="notes" rows={3} className={inputClass} />
              </Field>
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="h-fit bg-crema p-6 lg:sticky lg:top-6">
        <p className="label-xs mb-5">Resumen</p>

        <dl className="space-y-2.5 text-[13px] text-humo">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{money(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd>{envio === 0 ? "Sin costo" : money(envio)}</dd>
          </div>
        </dl>

        <div className="mt-3.5 flex justify-between border-t border-cafe/20 pt-3.5 font-serif text-xl text-cafe">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>

        {envio > 0 && (
          <p className="mt-3 text-[11px] leading-relaxed text-cobre">
            Te faltan {money(config.umbral - subtotalCents)} para el envío sin costo.
          </p>
        )}

        {error && (
          <p className="mt-4 border border-red-800/30 bg-red-50 p-3 text-[11px] leading-relaxed text-red-900">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-5 w-full">
          {loading ? "Redirigiendo a Stripe..." : "Pagar"}
        </Button>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-niebla">
          Pago procesado por Stripe. Acrotera nunca almacena los datos de tu tarjeta.
        </p>
      </aside>
    </form>
  );
}
