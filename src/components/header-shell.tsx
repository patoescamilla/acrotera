"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

const NAV = [
  { href: "/tienda?categoria=muebles", label: "Muebles" },
  { href: "/aromas", label: "Aromas" },
  { href: "/interiorismo", label: "Interiorismo" },
  { href: "/nosotros", label: "Nosotros" },
];

export type Promo = { texto: string; enlace: string } | null;

export function HeaderShell({ tone = "light", promo }: { tone?: "light" | "dark"; promo: Promo }) {
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);

  const dark = tone === "dark";
  const shell = dark ? "bg-tinta text-crema" : "bg-hueso text-cafe";
  const border = dark ? "border-crema/15" : "border-cafe/12";

  return (
    <header className={shell}>
      {promo && (
        <div className={`${dark ? "bg-black/40" : "bg-cafe text-crema"} label-xs py-2.5 text-center`}>
          {promo.enlace ? (
            <Link href={promo.enlace} className="transition-opacity hover:opacity-75">
              {promo.texto}
            </Link>
          ) : (
            promo.texto
          )}
        </div>
      )}

      <div className={`border-b ${border}`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-5 md:grid md:grid-cols-3 md:px-11">
          <nav className="label-xs hidden gap-7 md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="transition-opacity hover:opacity-60">
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
            className="text-lg leading-none md:hidden"
          >
            {open ? "×" : "☰"}
          </button>

          <Link href="/" aria-label="Acrotera" className="md:justify-self-center">
            <span className="logotipo h-[22px] w-[150px]" />
          </Link>

          <div className="label-xs flex items-center gap-6 md:justify-self-end">
            <Link href="/tienda" className="hidden transition-opacity hover:opacity-60 sm:inline">
              Buscar
            </Link>
            <Link href="/cuenta" className="hidden transition-opacity hover:opacity-60 sm:inline">
              Cuenta
            </Link>
            <Link href="/bolsa" className="transition-opacity hover:opacity-60">
              Bolsa ({ready ? count : 0})
            </Link>
          </div>
        </div>

        {open && (
          <nav className={`label-xs flex flex-col gap-4 border-t px-5 py-6 md:hidden ${border}`}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/cuenta" onClick={() => setOpen(false)}>
              Cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
