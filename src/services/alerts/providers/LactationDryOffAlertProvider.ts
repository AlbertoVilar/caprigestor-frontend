import { getFarmDryOffAlerts } from "../../../api/GoatFarmAPI/lactation";
import type { LactationDryOffAlertItemDTO } from "../../../Models/LactationDTOs";
import type { AlertItem, AlertProvider, AlertSeverity, AlertSummary } from "../AlertRegistry";

const DETAILS_PAGE_SIZE = 20;
const DRAWER_PREVIEW_SIZE = 5;

function resolveDryOffSeverity(daysOverdue: number): AlertSeverity {
  if (daysOverdue > 0) return "high";
  if (daysOverdue === 0) return "medium";
  return "low";
}

function resolvePriority(daysOverdue: number): number {
  if (daysOverdue > 0) {
    return 260 + Math.min(daysOverdue, 90);
  }

  if (daysOverdue === 0) {
    return 220;
  }

  return 180;
}

function mapDryOffAlertToItem(farmId: number, alert: LactationDryOffAlertItemDTO): AlertItem {
  const severity = resolveDryOffSeverity(alert.daysOverdue);
  const overdueText =
    alert.daysOverdue > 0
      ? `${alert.daysOverdue} dia(s) de atraso`
      : alert.daysOverdue === 0
        ? "Secagem recomendada para hoje"
        : "Secagem prevista";

  return {
    id: `${alert.goatId}-${alert.dryOffDate}`,
    source: "lactation",
    title: `Secagem pendente: ${alert.goatId}`,
    description: `${overdueText}. Gestacao com ${alert.gestationDays} dia(s).`,
    date: alert.dryOffDate,
    severity,
    priority: resolvePriority(alert.daysOverdue),
    goatId: alert.goatId,
    startDatePregnancy: alert.startDatePregnancy,
    dryOffDate: alert.dryOffDate,
    gestationDays: alert.gestationDays,
    daysOverdue: alert.daysOverdue,
    link: `/app/goatfarms/${farmId}/goats/${alert.goatId}/lactations/active`,
    actionLabel: "Ver lactacao"
  };
}

export const LactationDryOffAlertProvider: AlertProvider = {
  key: "lactation_drying",
  label: "Secagem (Lactacao)",
  priority: 90,

  getSummary: async (farmId: number): Promise<AlertSummary> => {
    try {
      const response = await getFarmDryOffAlerts(farmId, {
        page: 0,
        size: DRAWER_PREVIEW_SIZE
      });

      const previewItems = response.alerts.map((alert) => mapDryOffAlertToItem(farmId, alert));
      const worstOverdueDays = response.alerts.reduce(
        (max, current) => Math.max(max, current.daysOverdue),
        0
      );

      let headline: string | undefined;
      if (response.totalPending > 0) {
        headline =
          worstOverdueDays > 0
            ? `Maior atraso: ${worstOverdueDays} dia(s)`
            : "Secagem recomendada para hoje";
      }

      return {
        count: response.totalPending,
        headline,
        worstOverdueDays,
        previewItems
      };
    } catch (error) {
      console.error("Failed to fetch dry-off alerts summary", error);
      return { count: 0 };
    }
  },

  getList: async (farmId: number, params) => {
    try {
      const response = await getFarmDryOffAlerts(farmId, {
        referenceDate: params?.referenceDate,
        page: params?.page ?? 0,
        size: params?.size ?? DETAILS_PAGE_SIZE
      });

      return response.alerts.map((alert) => mapDryOffAlertToItem(farmId, alert));
    } catch (error) {
      console.error("Failed to fetch dry-off alerts list", error);
      return [];
    }
  },

  getRoute: (farmId: number) => `/app/goatfarms/${farmId}/alerts?type=lactation_drying`
};
