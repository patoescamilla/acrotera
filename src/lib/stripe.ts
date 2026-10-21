import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe() {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY en el entorno.");
  // Sin apiVersion explícita: se usa la que fija el SDK instalado.
  cached = new Stripe(key);
  return cached;
}
