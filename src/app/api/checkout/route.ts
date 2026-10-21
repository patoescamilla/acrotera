import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getSettingsAdmin, envioPara } from "@/lib/settings";
import { imageUrl } from "@/lib/supabase/images";
import type Stripe from "stripe";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Body = {
  items?: { productId: string; quantity: number }[];
  customer?: Record<string, string>;
};

const REQUIRED = ["customer_name", "email", "phone", "address_line1", "city", "state", "postal_code"];

// Topes deliberadamente holgados: no estorban a un cliente real y
// acotan lo que puede hacer alguien golpeando la API a mano.
const MAX_LINEAS = 30;
const MAX_POR_LINEA = 20;
const MAX_LARGO: Record<string, number> = {
  customer_name: 120,
  email: 254,
  phone: 25,
  address_line1: 200,
  address_line2: 200,
  city: 80,
  state: 80,
  postal_code: 10,
  notes: 500,
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Recorta, limpia y valida lo que llega del navegador. */
function limpiarCliente(entrada: Record<string, unknown>) {
  const salida: Record<string, string> = {};
  for (const [clave, largo] of Object.entries(MAX_LARGO)) {
    const valor = entrada[clave];
    if (typeof valor !== "string") continue;
    // Fuera caracteres de control, que solo sirven para ensuciar registros.
    salida[clave] = valor.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, largo);
  }
  return salida;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const items = (body.items ?? [])
    .filter(
      (i) =>
        typeof i?.productId === "string" &&
        UUID.test(i.productId) &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0,
    )
    .slice(0, MAX_LINEAS);

  const customer = limpiarCliente(body.customer ?? {});

  if (items.length === 0) {
    return NextResponse.json({ error: "Tu bolsa está vacía." }, { status: 400 });
  }

  if (items.some((i) => i.quantity > MAX_POR_LINEA)) {
    return NextResponse.json(
      { error: `Máximo ${MAX_POR_LINEA} piezas por artículo. Escríbenos para pedidos mayores.` },
      { status: 400 },
    );
  }

  // Un mismo producto repetido en varias líneas burlaría el tope de arriba.
  if (new Set(items.map((i) => i.productId)).size !== items.length) {
    return NextResponse.json({ error: "Hay artículos repetidos en la bolsa." }, { status: 400 });
  }

  const faltantes = REQUIRED.filter((k) => !customer[k]);
  if (faltantes.length > 0) {
    return NextResponse.json({ error: "Faltan datos de entrega." }, { status: 400 });
  }

  if (!EMAIL.test(customer.email)) {
    return NextResponse.json({ error: "El correo no parece válido." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Los precios SIEMPRE se releen de la base. Lo que manda el navegador
  // solo indica qué producto y cuántas piezas, nunca cuánto cuestan.
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, price_cents, currency, stock, status, product_images(path, sort_order)")
    .in("id", items.map((i) => i.productId));

  if (error) {
    return NextResponse.json({ error: "No pudimos leer el catálogo." }, { status: 500 });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const orderItems: {
    product_id: string;
    name_snapshot: string;
    price_cents: number;
    quantity: number;
    image_path: string | null;
  }[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = products?.find((p) => p.id === item.productId);

    if (!product || product.status !== "active") {
      return NextResponse.json(
        { error: "Una de las piezas ya no está disponible. Actualiza tu bolsa." },
        { status: 409 },
      );
    }

    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Solo quedan ${product.stock} piezas de ${product.name}.` },
        { status: 409 },
      );
    }

    const images = (product.product_images ?? []).sort((a, b) => a.sort_order - b.sort_order);
    const cover = images[0]?.path ?? null;
    const absolute = imageUrl(cover);

    subtotal += product.price_cents * item.quantity;

    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: (product.currency ?? "MXN").toLowerCase(),
        unit_amount: product.price_cents,
        product_data: {
          name: product.name,
          ...(absolute ? { images: [absolute] } : {}),
        },
      },
    });

    orderItems.push({
      product_id: product.id,
      name_snapshot: product.name,
      price_cents: product.price_cents,
      quantity: item.quantity,
      image_path: cover,
    });
  }

  const ajustes = await getSettingsAdmin();
  const shipping = envioPara(subtotal, ajustes);
  const total = subtotal + shipping;

  if (shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "mxn",
        unit_amount: shipping,
        product_data: { name: "Envío e instalación" },
      },
    });
  }

  const user = await getSessionUser();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      email: customer.email,
      status: "pending",
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: total,
      customer_name: customer.customer_name,
      phone: customer.phone,
      address_line1: customer.address_line1,
      address_line2: customer.address_line2 || null,
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      notes: customer.notes || null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "No pudimos registrar el pedido." }, { status: 500 });
  }

  await supabase
    .from("order_items")
    .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const methods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ["card"];
  if (process.env.STRIPE_ENABLE_OXXO === "true") methods.push("oxxo");

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: methods,
      line_items: lineItems,
      customer_email: customer.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: order.order_number },
      locale: "es",
      success_url: `${site}/pedido/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/bolsa?cancelado=1`,
    });

    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    const message = err instanceof Error ? err.message : "Error al contactar a Stripe.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
