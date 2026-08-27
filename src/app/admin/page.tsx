import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money, fecha } from "@/lib/format";
import { EstadoPill } from "@/components/admin/estado-pill";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supabase = await createClient();

  const [activos, borradores, sinStock, pendientes, recientes, pagados] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("stock", 0),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("orders").select("total_cents").eq("status", "paid"),
  ]);

  const ingresos = (pagados.data ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
  const orders = (recientes.data ?? []) as Order[];

  const tarjetas = [
    ["Productos publicados", String(activos.count ?? 0)],
    ["Borradores", String(borradores.count ?? 0)],
    ["Sin existencia", String(sinStock.count ?? 0)],
    ["Pedidos por enviar", String(pendientes.count ?? 0)],
    ["Ventas confirmadas", money(ingresos)],
  ];

  return (
    <div>
      <h1 className="mb-8 font-serif text-4xl font-light">Resumen</h1>

      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tarjetas.map(([label, value]) => (
          <div key={label} className="border border-cafe/12 bg-crema p-5">
            <p className="label-xs mb-2.5 text-niebla">{label}</p>
            <p className="font-serif text-3xl text-cafe">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-serif text-2xl font-light">Pedidos recientes</h2>
        <Link href="/admin/pedidos" className="label-xs text-cafe underline">Ver todos</Link>
      </div>

      {orders.length === 0 ? (
        <p className="border border-cafe/12 bg-crema p-8 text-center text-[13px] text-niebla">
          Todavia no hay pedidos.
        </p>
      ) : (
        <div className="overflow-x-auto border border-cafe/12">
          <table className="w-full text-left text-[13px]">
            <thead className="label-xs bg-crema text-niebla">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-cafe/10">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${o.id}`} className="text-cafe underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-humo">{o.customer_name ?? o.email}</td>
                  <td className="px-4 py-3 text-humo">{fecha(o.created_at)}</td>
                  <td className="px-4 py-3"><EstadoPill status={o.status} /></td>
                  <td className="px-4 py-3 text-right text-cafe">{money(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
