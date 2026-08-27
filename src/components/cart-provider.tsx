"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "acrotera.cart.v1";

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotalCents: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      // carrito corrupto: se descarta en silencio
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotalCents = lines.reduce((n, l) => n + l.priceCents * l.quantity, 0);

    return {
      lines,
      ready,
      count,
      subtotalCents,
      add(line, quantity = 1) {
        setLines((prev) => {
          const found = prev.find((l) => l.productId === line.productId);
          if (found) {
            return prev.map((l) =>
              l.productId === line.productId ? { ...l, quantity: l.quantity + quantity } : l,
            );
          }
          return [...prev, { ...line, quantity }];
        });
      },
      setQuantity(productId, quantity) {
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.productId !== productId)
            : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
        );
      },
      remove(productId) {
        setLines((prev) => prev.filter((l) => l.productId !== productId));
      },
      clear() {
        setLines([]);
      },
    };
  }, [lines, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
