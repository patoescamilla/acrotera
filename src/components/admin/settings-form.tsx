"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateSettings, type ActionState } from "@/app/admin/actions";
import { Field, inputClass } from "@/components/ui";
import type { SiteSetting } from "@/lib/types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="label-xs border border-cafe bg-cafe px-8 py-3.5 text-crema transition-colors hover:bg-tinta disabled:opacity-45"
    >
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

function Campo({ ajuste }: { ajuste: SiteSetting }) {
  const name = `set_${ajuste.key}`;
  const valor = ajuste.value ?? "";

  if (ajuste.type === "boolean") {
    return (
      <label className="flex items-start gap-3 py-1.5 text-[13px]">
        <input
          type="checkbox"
          name={name}
          defaultChecked={valor === "true"}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#2C1907]"
        />
        <span>
          {ajuste.label}
          {ajuste.hint && (
            <span className="mt-1 block text-[11px] leading-relaxed text-niebla">{ajuste.hint}</span>
          )}
        </span>
      </label>
    );
  }

  if (ajuste.type === "textarea") {
    return (
      <Field label={ajuste.label} hint={ajuste.hint ?? undefined}>
        <textarea name={name} rows={3} defaultValue={valor} className={inputClass} />
      </Field>
    );
  }

  if (ajuste.type === "money") {
    return (
      <Field label={ajuste.label} hint={ajuste.hint ?? undefined}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-niebla">$</span>
          <input
            name={name}
            inputMode="decimal"
            defaultValue={(Number(valor || 0) / 100).toString()}
            className={inputClass}
          />
        </div>
      </Field>
    );
  }

  return (
    <Field label={ajuste.label} hint={ajuste.hint ?? undefined}>
      <input name={name} defaultValue={valor} className={inputClass} />
    </Field>
  );
}

export function SettingsForm({ ajustes }: { ajustes: SiteSetting[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateSettings, null);

  const grupos = ajustes.reduce<Record<string, SiteSetting[]>>((acc, a) => {
    (acc[a.grupo] ??= []).push(a);
    return acc;
  }, {});

  return (
    <form action={formAction} className="space-y-6">
      {Object.entries(grupos).map(([grupo, campos]) => (
        <section key={grupo} className="border border-cafe/12 bg-crema p-6">
          <h2 className="label-xs mb-5 text-cafe">{grupo}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {campos.map((ajuste) => (
              <div
                key={ajuste.key}
                className={ajuste.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                <Campo ajuste={ajuste} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {state && (
        <p
          className={`p-3.5 text-[12px] leading-relaxed ${
            state.ok
              ? "border border-cafe/25 bg-crema text-cafe"
              : "border border-red-800/30 bg-red-50 text-red-900"
          }`}
        >
          {state.message}
        </p>
      )}

      <Submit />
    </form>
  );
}
