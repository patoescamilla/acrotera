import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EstadoPill } from "@/components/admin/estado-pill";
import { money, fecha } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTROS = [
  ["Todos", ""],
  ["Pagados", "paid"],
  ["Entregados", "fulfilled"],
  ["Pendientes", "pending"],
  ["Cancelados", "cancelled"],
] as const;

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, order_items(id, quantity)")
    .order("created_at", { ascending: false });

  if (estado) query = query.eq("status", estado);

  const { data } = await query;
  const orders = (data ?? []) as Order[];

  return (
    <div>
      <h1 className="mb-6 font-serif text-4xl font-light">Pedidos</h1>

      <nav className="label-xs mb-7 flex flex-wrap gap-5">
        {FILTROS.map(([label, value]) => (
          <Link
            key={label}
            href={value ? `/admin/pedidos?estado=${value}` : "/admin/pedidos"}
            className={(estado ?? "") === value ? "text-cafe underline" : "text-niebla hover:text-cafe"}
          >
            {label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="border border-cafe/12 bg-crema p-12 text-center text-[13px] text-niebla">
          No hay pedidos con este filtro.
        </p>
      ) : (
        <div className="overflow-x-auto border border-cafe/12">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="label-xs bg-crema text-niebla">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Piezas</th>
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
                  <td className="px-4 py-3 text-humo">
                    {o.customer_name ?? "-"}
                    <span className="block text-[11px] text-niebla">{o.email}</span>
                  </td>
                  <td className="px-4 py-3 text-humo">
                    {(o.order_items ?? []).reduce((n, i) => n + i.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-humo">{fecha(o.created_at)}</td>
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
    </div>
  );
}
