import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClearCart } from "@/components/clear-cart";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedido confirmado" };

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const ajustes = await getSettings();

  let order: { order_number: string; email: string; total_cents: number; status: string } | null = null;

  if (session_id) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("orders")
      .select("order_number, email, total_cents, status")
      .eq("stripe_session_id", session_id)
      .maybeSingle();
    order = data;
  }

  return (
    <>
      <SiteHeader />
      <ClearCart />

      <main className="mx-auto max-w-lg px-5 py-28 text-center">
        <span className="eyebrow">Gracias</span>
        <h1 className="mt-4 font-serif text-4xl font-light leading-tight">
          Tu pedido está
          <br />
          confirmado
        </h1>

        {order ? (
          <div className="mt-8 bg-crema p-7 text-left">
            <dl className="space-y-3 text-[13px] text-humo">
              <div className="flex justify-between">
                <dt>Número de pedido</dt>
                <dd className="text-cafe">{order.order_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Confirmación enviada a</dt>
                <dd className="text-cafe">{order.email}</dd>
              </div>
              <div className="flex justify-between border-t border-cafe/20 pt-3 font-serif text-lg text-cafe">
                <dt>Total</dt>
                <dd>{money(order.total_cents)}</dd>
              </div>
            </dl>
            {order.status === "pending" && (
              <p className="mt-4 text-[11px] leading-relaxed text-cobre">
                Estamos esperando la confirmación del pago. Si pagaste en OXXO, el pedido se
                activa en cuanto el depósito se registre.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-6 text-[13px] leading-relaxed text-humo">
            Recibirás un correo con los detalles de tu compra en los próximos minutos.
          </p>
        )}

        <p className="mt-8 text-[13px] leading-[1.9] text-humo">
          Nos pondremos en contacto para coordinar la entrega. Si tienes dudas, escríbenos a
          {ajustes.contacto_email}.
        </p>

        <Link href="/tienda" className="label-xs mt-8 inline-block border border-cafe px-8 py-3.5 text-cafe">
          Seguir viendo
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}
