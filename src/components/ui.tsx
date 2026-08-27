import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Tone = "solid" | "outline" | "light";

const TONES: Record<Tone, string> = {
  solid: "bg-cafe text-crema border-cafe hover:bg-tinta",
  outline: "border-cafe text-cafe hover:bg-cafe hover:text-crema",
  light: "border-crema text-crema hover:bg-crema hover:text-cafe",
};

const BASE =
  "inline-block border label-xs px-8 py-3.5 text-center transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-45";

export function ButtonLink({
  href,
  tone = "outline",
  className = "",
  children,
}: {
  href: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${TONES[tone]} ${className}`}>
      {children}
    </Link>
  );
}

export function Button({
  tone = "solid",
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { tone?: Tone }) {
  return (
    <button {...props} className={`${BASE} ${TONES[tone]} ${className}`}>
      {children}
    </button>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  tone = "light",
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  tone?: "light" | "dark";
  align?: "center" | "left";
}) {
  return (
    <div className={`mb-10 ${align === "center" ? "text-center" : ""}`}>
      {eyebrow && <span className="eyebrow mb-3.5 block">{eyebrow}</span>}
      <h2 className={`font-serif text-4xl font-light leading-tight ${tone === "dark" ? "text-crema" : ""}`}>
        {title}
      </h2>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-xs mb-2 block text-cafe">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] text-niebla">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full border border-cafe/25 bg-white px-3.5 py-2.5 text-sm font-light outline-none transition-colors placeholder:text-niebla/70 focus:border-cafe";
