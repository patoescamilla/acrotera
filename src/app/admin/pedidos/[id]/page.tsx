import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { EstadoPill } from "@/components/admin/estado-pill";
import { imageUrl } from "@/lib/supabase/images";
import { money, fecha } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as Order;

  const direccion = [
    order.address_line1,
    order.address_line2,
    [order.postal_code, order.city].filter(Boolean).join(" "),
    order.state,
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/pedidos" className="label-xs text-niebla underline">
        Volver a pedidos
      </Link>

      <div className="mb-1 mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-4xl font-light">{order.order_number}</h1>
        <EstadoPill status={order.status} />
      </div>
      <p className="mb-8 text-[13px] text-humo">{fecha(order.created_at)}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="border border-cafe/12 bg-crema p-6">
          <h2 className="label-xs mb-5 text-cafe">Artículos</h2>

          {(order.order_items ?? []).map((item) => {
            const src = imageUrl(item.image_path);
            return (
              <div
                key={item.id}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-t border-cafe/12 py-3.5 first:border-t-0"
              >
                <div className="relative aspect-[4/5] bg-arena">
                  {src && <Image src={src} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div>
                  <p className="font-serif text-base">{item.name_snapshot}</p>
                  <p className="text-[11px] text-niebla">
                    {item.quantity} x {money(item.price_cents)}
                  </p>
                </div>
                <p className="text-[13px] text-cafe">{money(item.price_cents * item.quantity)}</p>
              </div>
            );
          })}

          <dl className="mt-5 space-y-2 border-t border-cafe/20 pt-4 text-[13px] text-humo">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal_cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd>{order.shipping_cents === 0 ? "Sin costo" : money(order.shipping_cents)}</dd>
            </div>
            <div className="flex justify-between border-t border-cafe/20 pt-2.5 font-serif text-lg text-cafe">
              <dt>Total</dt>
              <dd>{money(order.total_cents)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          <div className="border border-cafe/12 bg-crema p-6">
            <h2 className="label-xs mb-4 text-cafe">Cliente</h2>
            <p className="text-[13px] leading-[1.9] text-humo">
              {order.customer_name}
              <br />
              {order.email}
              <br />
              {order.phone}
            </p>

            <h2 className="label-xs mb-3 mt-6 text-cafe">Entrega</h2>
            <p className="text-[13px] leading-[1.9] text-humo">
              {direccion.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>

            {order.notes && (
              <>
                <h2 className="label-xs mb-3 mt-6 text-cafe">Notas</h2>
                <p className="text-[13px] leading-[1.9] text-humo">{order.notes}</p>
              </>
            )}
          </div>

          <div className="border border-cafe/12 bg-crema p-6">
            <OrderStatusForm orderId={order.id} current={order.status} />

            {order.stripe_payment_intent && (
              <p className="mt-4 break-all text-[10px] leading-relaxed text-niebla">
                Stripe: {order.stripe_payment_intent}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
