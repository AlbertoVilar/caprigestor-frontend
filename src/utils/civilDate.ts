export const BRAZIL_CIVIL_TIME_ZONE = "America/Sao_Paulo";

export function formatCivilDateInZone(date: Date, timeZone = BRAZIL_CIVIL_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayInSaoPaulo(now = new Date()): string {
  return formatCivilDateInZone(now);
}
