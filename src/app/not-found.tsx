import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <span className="eyebrow">Error 404</span>
      <h1 className="mt-4 font-serif text-5xl font-light">Esta página no existe</h1>
      <p className="mt-4 max-w-sm text-[13px] leading-[1.9] text-humo">
        Puede que la pieza que buscabas ya no esté disponible.
      </p>
      <Link href="/" className="label-xs mt-8 border border-cafe px-8 py-3.5 text-cafe">
        Volver al inicio
      </Link>
    </main>
  );
}
