import { HealthAlertsDTO } from "../../Models/HealthAlertsDTO";
import { HealthEventResponseDTO } from "../../Models/HealthDTOs";
import { InventoryBalance, InventoryItem, InventoryMovementHistoryEntry } from "../../Models/InventoryDTOs";
import { LactationResponseDTO, LactationDryOffAlertResponseDTO } from "../../Models/LactationDTOs";
import { MilkProductionResponseDTO } from "../../Models/MilkProductionDTOs";
import { GoatHerdSummaryDTO } from "../../Models/GoatHerdSummaryDTO";
import {
  PregnancyDiagnosisAlertResponseDTO,
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO
} from "../../Models/ReproductionDTOs";

export type FarmReportTab = "overview" | "health" | "inventory" | "reproduction" | "lactation";

export type CsvCell = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvCell>;

function escapeCsvValue(value: CsvCell): string {
  if (value == null) return "";
  const text = String(value);
  if (text.includes(";") || text.includes("\n") || text.includes('"')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function buildCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(";");
  const body = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(";"));
  return [headerLine, ...body].join("\n");
}

export function downloadCsv(filename: string, rows: CsvRow[]) {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(parsed);
}

export function buildOverviewRows(data: {
  herdSummary: GoatHerdSummaryDTO | null;
  healthAlerts: HealthAlertsDTO | null;
  pregnancyAlerts: PregnancyDiagnosisAlertResponseDTO | null;
  dryOffAlerts: LactationDryOffAlertResponseDTO | null;
  inventoryBalances: InventoryBalance[];
}): CsvRow[] {
  return [
    { indicador: "Total do rebanho", valor: data.herdSummary?.total ?? 0 },
    { indicador: "Fêmeas", valor: data.herdSummary?.females ?? 0 },
    { indicador: "Machos", valor: data.herdSummary?.males ?? 0 },
    { indicador: "Animais ativos", valor: data.herdSummary?.active ?? 0 },
    { indicador: "Alertas sanitários hoje", valor: data.healthAlerts?.dueTodayCount ?? 0 },
    { indicador: "Alertas sanitários próximos", valor: data.healthAlerts?.upcomingCount ?? 0 },
    { indicador: "Alertas sanitários em atraso", valor: data.healthAlerts?.overdueCount ?? 0 },
    { indicador: "Diagnósticos reprodutivos pendentes", valor: data.pregnancyAlerts?.totalPending ?? 0 },
    { indicador: "Secagens recomendadas", valor: data.dryOffAlerts?.totalPending ?? 0 },
    { indicador: "Saldos de estoque acompanhados", valor: data.inventoryBalances.length }
  ];
}

export function buildHealthRows(events: HealthEventResponseDTO[]): CsvRow[] {
  return events.map((event) => ({
    data: formatDate(event.scheduledDate),
    cabra: event.goatId,
    titulo: event.title,
    tipo: event.type,
    status: event.status,
    atraso: event.overdue ? "Sim" : "Não"
  }));
}

export function buildInventoryRows(data: {
  items: InventoryItem[];
  balances: InventoryBalance[];
  movements: InventoryMovementHistoryEntry[];
}): CsvRow[] {
  return [
    ...data.items.map((item) => ({
      secao: "Item",
      identificador: item.id,
      nome: item.name,
      lote: item.trackLot ? "Controlado" : "Sem lote",
      valor: item.active ? "Ativo" : "Inativo"
    })),
    ...data.balances.map((balance) => ({
      secao: "Saldo",
      identificador: balance.itemId,
      nome: balance.itemName,
      lote: balance.lotId ?? "-",
      valor: balance.quantity
    })),
    ...data.movements.map((movement) => ({
      secao: "Movimentação",
      identificador: movement.movementId,
      nome: movement.itemName,
      lote: movement.lotId ?? "-",
      valor: `${movement.type} ${movement.quantity} em ${formatDate(movement.movementDate)}`
    }))
  ];
}

export function buildReproductionRows(data: {
  events: ReproductiveEventResponseDTO[];
  pregnancies: PregnancyResponseDTO[];
}): CsvRow[] {
  return [
    ...data.events.map((event) => ({
      secao: "Evento reprodutivo",
      data: formatDate(event.eventDate),
      tipo: event.eventType,
      detalhe: event.breedingType ?? event.checkResult ?? "-",
      observacoes: event.notes ?? "-"
    })),
    ...data.pregnancies.map((pregnancy) => ({
      secao: "Gestação",
      data: formatDate(pregnancy.breedingDate ?? pregnancy.confirmDate ?? pregnancy.closeDate),
      tipo: pregnancy.status,
      detalhe: pregnancy.closeReason ?? "-",
      observacoes: pregnancy.notes ?? "-"
    }))
  ];
}

export function buildLactationRows(data: {
  history: LactationResponseDTO[];
  productions: MilkProductionResponseDTO[];
}): CsvRow[] {
  return [
    ...data.history.map((entry) => ({
      secao: "Lactação",
      data: formatDate(entry.startDate),
      tipo: entry.status,
      detalhe: entry.endDate ? `Encerrada em ${formatDate(entry.endDate)}` : "Em andamento",
      observacoes: entry.pregnancyStartDate ? `Gestação desde ${formatDate(entry.pregnancyStartDate)}` : "-"
    })),
    ...data.productions.map((production) => ({
      secao: "Produção de leite",
      data: formatDate(production.date),
      tipo: production.shift,
      detalhe: `${production.volumeLiters} L`,
      observacoes: production.notes ?? "-"
    }))
  ];
}

export function getReportFilename(tab: FarmReportTab, farmName?: string, goatId?: string) {
  const scope = goatId ? `${tab}-${goatId}` : tab;
  const safeFarm = (farmName ?? "fazenda").trim().toLowerCase().replace(/\s+/g, "-");
  return `caprigestor-${safeFarm}-${scope}.csv`;
}
