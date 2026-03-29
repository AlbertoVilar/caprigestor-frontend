import { HealthAlertsDTO, WithdrawalAlertItemDTO } from "../../Models/HealthAlertsDTO";
import { HealthEventResponseDTO } from "../../Models/HealthDTOs";
import { LactationDryOffAlertResponseDTO } from "../../Models/LactationDTOs";
import { PregnancyDiagnosisAlertResponseDTO } from "../../Models/ReproductionDTOs";

export type FarmOperationalAgendaSource = "health" | "reproduction" | "lactation";
export type FarmOperationalAgendaFilter = "all" | FarmOperationalAgendaSource;

export interface FarmOperationalAgendaItem {
  id: string;
  source: FarmOperationalAgendaSource;
  sourceLabel: string;
  title: string;
  description: string;
  goatId: string;
  date: string;
  href: string;
  overdue: boolean;
  overdueDays?: number;
}

export interface FarmOperationalAgendaSummary {
  totalAttention: number;
  counts: Record<FarmOperationalAgendaSource, number>;
  items: FarmOperationalAgendaItem[];
}

interface BuildFarmOperationalAgendaInput {
  healthAlerts: HealthAlertsDTO | null;
  pregnancyAlerts: PregnancyDiagnosisAlertResponseDTO | null;
  dryOffAlerts: LactationDryOffAlertResponseDTO | null;
  maxItems?: number;
}

const SOURCE_LABELS: Record<FarmOperationalAgendaSource, string> = {
  health: "Sanidade",
  reproduction: "Reprodução",
  lactation: "Lactação"
};

function isValidDate(value: string | undefined | null): value is string {
  return Boolean(value) && !Number.isNaN(Date.parse(value as string));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

function compareDates(left: string, right: string): number {
  return new Date(`${left}T00:00:00Z`).getTime() - new Date(`${right}T00:00:00Z`).getTime();
}

function getPriority(item: FarmOperationalAgendaItem): number {
  return item.overdue ? 0 : 1;
}

function toHealthItems(farmId: number, alerts: HealthAlertsDTO | null): FarmOperationalAgendaItem[] {
  if (!alerts || Number.isNaN(farmId)) return [];

  const seen = new Set<string>();
  const items: FarmOperationalAgendaItem[] = [];

  const pushEvent = (event: HealthEventResponseDTO, source: "due" | "upcoming" | "overdue") => {
    const key = `event-${event.id}`;
    if (seen.has(key) || !isValidDate(event.scheduledDate)) return;
    seen.add(key);

    const sourceDescription = source === "overdue"
      ? "Evento sanitário em atraso"
      : source === "due"
        ? "Evento sanitário previsto para hoje"
        : "Evento sanitário programado para os próximos dias";

    items.push({
      id: `health-${event.id}`,
      source: "health",
      sourceLabel: SOURCE_LABELS.health,
      title: event.title,
      description: `${sourceDescription} · Cabra ${event.goatId}`,
      goatId: event.goatId,
      date: event.scheduledDate,
      href: `/app/goatfarms/${farmId}/goats/${encodeURIComponent(event.goatId)}/health/${event.id}`,
      overdue: event.overdue || source === "overdue"
    });
  };

  const pushWithdrawal = (item: WithdrawalAlertItemDTO, type: "milk" | "meat") => {
    const key = `withdrawal-${type}-${item.eventId}`;
    if (seen.has(key) || !isValidDate(item.withdrawalEndDate)) return;
    seen.add(key);

    items.push({
      id: `health-withdrawal-${type}-${item.eventId}`,
      source: "health",
      sourceLabel: SOURCE_LABELS.health,
      title: type === "milk" ? "Carência de leite ativa" : "Carência de carne ativa",
      description: `Cabra ${item.goatId} · bloqueio até ${formatDate(item.withdrawalEndDate)}`,
      goatId: item.goatId,
      date: item.withdrawalEndDate,
      href: `/app/goatfarms/${farmId}/goats/${encodeURIComponent(item.goatId)}/health/${item.eventId}`,
      overdue: false
    });
  };

  alerts.overdueTop.forEach((event) => pushEvent(event, "overdue"));
  alerts.dueTodayTop.forEach((event) => pushEvent(event, "due"));
  alerts.upcomingTop.forEach((event) => pushEvent(event, "upcoming"));
  (alerts.milkWithdrawalTop || []).forEach((item) => pushWithdrawal(item, "milk"));
  (alerts.meatWithdrawalTop || []).forEach((item) => pushWithdrawal(item, "meat"));

  return items;
}

function toPregnancyItems(farmId: number, response: PregnancyDiagnosisAlertResponseDTO | null): FarmOperationalAgendaItem[] {
  if (!response || Number.isNaN(farmId)) return [];

  return response.alerts
    .filter((alert) => isValidDate(alert.eligibleDate))
    .map((alert) => ({
      id: `reproduction-${alert.goatId}-${alert.eligibleDate}`,
      source: "reproduction" as const,
      sourceLabel: SOURCE_LABELS.reproduction,
      title: "Diagnóstico de prenhez pendente",
      description: `Cabra ${alert.goatId} · última cobertura em ${formatDate(alert.lastCoverageDate)}`,
      goatId: alert.goatId,
      date: alert.eligibleDate,
      href: `/app/goatfarms/${farmId}/goats/${encodeURIComponent(alert.goatId)}/reproduction`,
      overdue: alert.daysOverdue > 0,
      overdueDays: alert.daysOverdue
    }));
}

function toDryOffItems(farmId: number, response: LactationDryOffAlertResponseDTO | null): FarmOperationalAgendaItem[] {
  if (!response || Number.isNaN(farmId)) return [];

  return response.alerts
    .filter((alert) => isValidDate(alert.dryOffDate))
    .map((alert) => ({
      id: `lactation-${alert.goatId}-${alert.dryOffDate}`,
      source: "lactation" as const,
      sourceLabel: SOURCE_LABELS.lactation,
      title: "Secagem recomendada",
      description: `Cabra ${alert.goatId} · gestação com ${alert.gestationDays} dias`,
      goatId: alert.goatId,
      date: alert.dryOffDate,
      href: `/app/goatfarms/${farmId}/goats/${encodeURIComponent(alert.goatId)}/lactations/active`,
      overdue: alert.daysOverdue > 0,
      overdueDays: alert.daysOverdue
    }));
}

export function buildFarmOperationalAgenda(
  farmId: number,
  {
    healthAlerts,
    pregnancyAlerts,
    dryOffAlerts,
    maxItems = 6
  }: BuildFarmOperationalAgendaInput
): FarmOperationalAgendaSummary {
  const healthItems = toHealthItems(farmId, healthAlerts);
  const pregnancyItems = toPregnancyItems(farmId, pregnancyAlerts);
  const dryOffItems = toDryOffItems(farmId, dryOffAlerts);

  const items = [...healthItems, ...pregnancyItems, ...dryOffItems]
    .sort((left, right) => {
      const priorityDelta = getPriority(left) - getPriority(right);
      if (priorityDelta !== 0) return priorityDelta;

      const dateDelta = compareDates(left.date, right.date);
      if (dateDelta !== 0) return dateDelta;

      return left.title.localeCompare(right.title, "pt-BR");
    })
    .slice(0, maxItems);

  return {
    totalAttention:
      (healthAlerts?.dueTodayCount ?? 0) +
      (healthAlerts?.upcomingCount ?? 0) +
      (healthAlerts?.overdueCount ?? 0) +
      (healthAlerts?.activeMilkWithdrawalCount ?? 0) +
      (healthAlerts?.activeMeatWithdrawalCount ?? 0) +
      (pregnancyAlerts?.totalPending ?? 0) +
      (dryOffAlerts?.totalPending ?? 0),
    counts: {
      health:
        (healthAlerts?.dueTodayCount ?? 0) +
        (healthAlerts?.upcomingCount ?? 0) +
        (healthAlerts?.overdueCount ?? 0) +
        (healthAlerts?.activeMilkWithdrawalCount ?? 0) +
        (healthAlerts?.activeMeatWithdrawalCount ?? 0),
      reproduction: pregnancyAlerts?.totalPending ?? 0,
      lactation: dryOffAlerts?.totalPending ?? 0
    },
    items
  };
}

export function formatOperationalAgendaDate(value: string): string {
  return formatDate(value);
}