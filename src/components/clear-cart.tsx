"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

/** Vacia la bolsa al aterrizar en la página de confirmación. */
export function ClearCart() {
  const { clear, ready } = useCart();

  useEffect(() => {
    if (ready) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return null;
}
