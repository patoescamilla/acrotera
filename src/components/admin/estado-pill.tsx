const MAP: Record<string, [string, string]> = {
  pending: ["Pendiente", "bg-arena/40 text-cafe"],
  paid: ["Pagado", "bg-cafe text-crema"],
  fulfilled: ["Entregado", "bg-cobre/25 text-cafe"],
  cancelled: ["Cancelado", "bg-niebla/20 text-niebla"],
  refunded: ["Reembolsado", "bg-niebla/20 text-niebla"],
  active: ["Publicado", "bg-cafe text-crema"],
  draft: ["Borrador", "bg-arena/40 text-cafe"],
  archived: ["Archivado", "bg-niebla/20 text-niebla"],
};

export function EstadoPill({ status }: { status: string }) {
  const [label, cls] = MAP[status] ?? [status, "bg-niebla/20 text-niebla"];
  return <span className={`label-xs inline-block px-2.5 py-1 ${cls}`}>{label}</span>;
}
