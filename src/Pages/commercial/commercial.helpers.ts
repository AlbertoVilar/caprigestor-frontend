import type { CommercialSummaryDTO, ReceivableResponseDTO, SalePaymentStatus } from "../../Models/CommercialDTOs";

export function formatCommercialCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function formatCommercialNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function normalizeDateValue(value: string | number[] | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

export function formatCommercialDate(value: string | number[] | null | undefined): string {
  const normalized = normalizeDateValue(value);
  if (!normalized) return "-";
  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return normalized;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatPaymentStatusLabel(status: SalePaymentStatus): string {
  return status === "PAID" ? "Recebido" : "Em aberto";
}

export function isOverdueReceivable(
  receivable: ReceivableResponseDTO,
  referenceDate: string = new Date().toISOString().slice(0, 10)
): boolean {
  const dueDate = normalizeDateValue(receivable.dueDate);
  return receivable.paymentStatus === "OPEN" && dueDate !== null && dueDate < referenceDate;
}

export function formatReceivableStatusLabel(
  receivable: ReceivableResponseDTO,
  referenceDate?: string
): string {
  if (receivable.paymentStatus === "PAID") {
    return "Recebido";
  }

  return isOverdueReceivable(receivable, referenceDate) ? "Em atraso" : "Em aberto";
}

export function buildCommercialSummaryCards(summary: CommercialSummaryDTO) {
  return [
    { label: "Clientes ativos", value: String(summary.customerCount) },
    { label: "Vendas de animais", value: formatCommercialCurrency(summary.animalSalesTotal) },
    { label: "Vendas de leite", value: formatCommercialCurrency(summary.milkSalesTotal) },
    { label: "Recebiveis em aberto", value: formatCommercialCurrency(summary.openReceivablesTotal) },
  ];
}

export function isOpenReceivable(receivable: ReceivableResponseDTO): boolean {
  return receivable.paymentStatus === "OPEN";
}

function escapeCsvValue(value: string | number | null | undefined): string {
  const normalized = String(value ?? "");
  if (/[;"\n\r,]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function buildCommercialCsvContent(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): string {
  const lines = [
    headers.map(escapeCsvValue).join(";"),
    ...rows.map((row) => row.map(escapeCsvValue).join(";")),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
