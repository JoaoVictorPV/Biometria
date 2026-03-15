export function formatDayBR(isoOrDate: string) {
  // Se vier como YYYY-MM-DD, NÃO usar Date(), pois o JS interpreta como UTC e pode "voltar um dia" no Brasil.
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) {
    const [y, m, day] = isoOrDate.split("-");
    return `${day}/${m}/${y}`;
  }

  const d = new Date(isoOrDate);
  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }

  return isoOrDate;
}

export function formatTimeBR(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatDateTimeBR(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatNumber(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}
