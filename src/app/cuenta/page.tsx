import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EstadoPill } from "@/components/admin/estado-pill";
import { createClient } from "@/lib/supabase/server";
import { money, fecha } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const supabase = await createClient();
  const ajustes = await getSettings();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/cuenta");

  const [{ data: profile }, { data: ordersData }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, role").eq("id", user.id).maybeSingle(),
    supabase
      .from("orders")
      .select("*, order_items(id, quantity)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const orders = (ordersData ?? []) as Order[];

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[1000px] px-5 py-12 pb-24 md:px-11">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Mi cuenta</span>
            <h1 className="mt-2 font-serif text-4xl font-light">
              Hola{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 text-[13px] text-humo">{profile?.email ?? user.email}</p>
          </div>

          <div className="flex items-center gap-5">
            {profile?.role === "admin" && (
              <Link href="/admin" className="label-xs text-cafe underline">
                Ir al panel
              </Link>
            )}
            <Link href="/cuenta/contrasena" className="label-xs text-cafe underline">
              Cambiar contrasena
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="label-xs text-niebla underline">
                Cerrar sesion
              </button>
            </form>
          </div>
        </div>

        <h2 className="mb-4 font-serif text-2xl font-light">Mis pedidos</h2>

        {orders.length === 0 ? (
          <div className="border border-cafe/12 bg-crema p-12 text-center">
            <p className="mb-6 text-[13px] text-niebla">Todavía no tienes pedidos.</p>
            <Link href="/tienda" className="label-xs border border-cafe px-8 py-3.5 text-cafe">
              Ver el catalogo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-cafe/12">
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead className="label-xs bg-crema text-niebla">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Piezas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-cafe/10">
                    <td className="px-4 py-3">
                      <Link href={`/cuenta/pedidos/${o.id}`} className="text-cafe underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-humo">{fecha(o.created_at)}</td>
                    <td className="px-4 py-3 text-humo">
                      {(o.order_items ?? []).reduce((n, i) => n + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoPill status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-cafe">{money(o.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-8 text-[12px] leading-relaxed text-niebla">
          Compraste como invitado y no ves tu pedido aqui? Los pedidos hechos sin sesion no quedan
          ligados a una cuenta. Escribenos a {ajustes.contacto_email} con tu numero de pedido.
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
