"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const agotado = product.stock <= 0;
  const max = Math.max(1, product.stock);

  function handleAdd() {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.price_cents,
        image: product.product_images?.[0]?.path ?? null,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div>
      <div className="grid grid-cols-[110px_1fr] gap-3.5">
        <div className="flex items-center justify-between border border-cafe/25 px-3.5 text-sm">
          <button
            type="button"
            aria-label="Quitar uno"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="py-3 disabled:opacity-30"
            disabled={agotado || qty <= 1}
          >
            −
          </button>
          <span>{qty}</span>
          <button
            type="button"
            aria-label="Agregar uno"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            className="py-3 disabled:opacity-30"
            disabled={agotado || qty >= max}
          >
            +
          </button>
        </div>

        <Button onClick={handleAdd} disabled={agotado} className="w-full">
          {agotado ? "Agotado" : added ? "Agregado a la bolsa" : "Añadir a la bolsa"}
        </Button>
      </div>

      {!agotado && product.stock <= 3 && (
        <p className="mt-3 text-[11px] text-cobre">
          Quedan {product.stock} {product.stock === 1 ? "pieza" : "piezas"} en existencia.
        </p>
      )}
    </div>
  );
}
