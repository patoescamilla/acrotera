"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateOrderStatus, type ActionState } from "@/app/admin/actions";
import type { OrderStatus } from "@/lib/types";

const ESTADOS: [OrderStatus, string][] = [
  ["pending", "Pendiente"],
  ["paid", "Pagado"],
  ["fulfilled", "Entregado"],
  ["cancelled", "Cancelado"],
  ["refunded", "Reembolsado"],
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="label-xs w-full border border-cafe bg-cafe py-3 text-crema transition-colors hover:bg-tinta disabled:cursor-not-allowed disabled:opacity-45"
    >
      {pending ? "Guardando..." : "Actualizar"}
    </button>
  );
}

export function OrderStatusForm({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateOrderStatus, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="order_id" value={orderId} />
      <h2 className="label-xs mb-4 text-cafe">Cambiar estado</h2>

      <select
        name="status"
        defaultValue={current}
        className="mb-4 w-full border border-cafe/25 bg-white px-3.5 py-2.5 text-sm font-light outline-none transition-colors focus:border-cafe"
      >
        {ESTADOS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <Submit />

      {state && (
        <p
          aria-live="polite"
          className={`mt-3 p-2.5 text-[11px] leading-relaxed ${
            state.ok
              ? "border border-cafe/25 bg-hueso text-cafe"
              : "border border-red-800/30 bg-red-50 text-red-900"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
