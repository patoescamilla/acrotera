import Link from "next/link";
import { SettingsForm } from "@/components/admin/settings-form";
import { createClient } from "@/lib/supabase/server";
import type { SiteSetting } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TextosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").order("sort_order");

  if (error) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-4 font-serif text-4xl font-light">Textos</h1>
        <div className="border border-cobre/40 bg-crema p-6">
          <p className="mb-3 text-[13px] leading-relaxed text-humo">
            Falta un paso en la base de datos. Abre Supabase, ve al SQL Editor y ejecuta el archivo{" "}
            <code className="text-cafe">supabase/migration-02-textos.sql</code> del proyecto.
            Después recarga esta página.
          </p>
          <p className="text-[11px] leading-relaxed text-niebla">Detalle técnico: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 font-serif text-4xl font-light">Textos</h1>
      <p className="mb-9 max-w-xl text-[13px] leading-[1.9] text-humo">
        El anuncio de arriba, el titular de la portada, el monto de envío gratis y los datos de
        contacto. Los cambios se ven en la tienda de inmediato.
      </p>

      <SettingsForm ajustes={(data ?? []) as SiteSetting[]} />

      <p className="mt-8 text-[13px] text-humo">
        <Link href="/" className="underline">
          Ver la tienda
        </Link>{" "}
        para revisar cómo quedaron.
      </p>
    </div>
  );
}
