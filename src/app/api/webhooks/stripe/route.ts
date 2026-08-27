import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

/**
 * Stripe avisa aquí cuando un pago se completa.
 * La firma se verifica contra STRIPE_WEBHOOK_SECRET: sin eso, cualquiera
 * podria marcar pedidos como pagados con un simple POST.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la firma." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "firma invalida";
    return NextResponse.json({ error: `Firma invalida: ${message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id;
      if (!orderId) break;

      // Idempotencia: si el pedido ya estaba pagado no volvemos a descontar stock.
      const { data: current } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .maybeSingle();

      if (current?.status === "paid" || current?.status === "fulfilled") break;

      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_payment_intent:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
        })
        .eq("id", orderId);

      await supabase.rpc("decrement_stock", { p_order_id: orderId });
      break;
    }

    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId)
          .eq("status", "pending");
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
