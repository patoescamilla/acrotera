import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EstadoPill } from "@/components/admin/estado-pill";
import { createClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/supabase/images";
import { money, fecha } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Detalle del pedido" };

export default async function PedidoClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const ajustes = await getSettings();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/cuenta/pedidos/${id}`);

  // Las reglas de la base ya limitan esto a los pedidos propios:
  // si el pedido es de alguien más, simplemente no aparece.
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
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[860px] px-5 py-12 pb-24 md:px-11">
        <Link href="/cuenta" className="label-xs text-niebla underline">
          Volver a mis pedidos
        </Link>

        <div className="mb-1 mt-4 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-4xl font-light">{order.order_number}</h1>
          <EstadoPill status={order.status} />
        </div>
        <p className="mb-9 text-[13px] text-humo">{fecha(order.created_at)}</p>

        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
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
                  <p className="text-[13px] text-cafe">
                    {money(item.price_cents * item.quantity)}
                  </p>
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

          <div className="border border-cafe/12 bg-crema p-6">
            <h2 className="label-xs mb-4 text-cafe">Entrega</h2>
            <p className="text-[13px] leading-[1.9] text-humo">
              {order.customer_name}
              <br />
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

            <p className="mt-6 text-[11px] leading-relaxed text-niebla">
              ¿Dudas sobre este pedido? Escríbenos a {ajustes.contacto_email} citando el número{" "}
              {order.order_number}.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
