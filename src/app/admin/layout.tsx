import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/server";

const NAV = [
  ["Resumen", "/admin"],
  ["Productos", "/admin/productos"],
  ["Portada", "/admin/portada"],
  ["Textos", "/admin/textos"],
  ["Pedidos", "/admin/pedidos"],
] as const;

export const metadata = { title: "Panel" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/login?redirect=/admin");

  return (
    <div className="min-h-screen bg-hueso md:grid md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col justify-between border-b border-cafe/12 bg-crema p-6 md:min-h-screen md:border-b-0 md:border-r">
        <div>
          <Link href="/" className="mb-9 block text-cafe">
            <span className="logotipo h-[18px] w-[130px]" />
          </Link>

          <nav className="label-xs flex gap-5 md:flex-col md:gap-4">
            {NAV.map(([label, href]) => (
              <Link key={href} href={href} className="text-cafe transition-opacity hover:opacity-60">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-cafe/12 pt-5">
          <p className="mb-3 break-all text-[11px] leading-relaxed text-niebla">{user.email}</p>
          <form action="/auth/signout" method="post">
            <input type="hidden" name="next" value="/login" />
            <button type="submit" className="label-xs text-cafe underline">
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>

      <main className="p-6 md:p-11">{children}</main>
    </div>
  );
}
