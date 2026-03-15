import { AlertProvider, AlertSummary, AlertItem, AlertListParams, AlertSeverity } from "../AlertRegistry";
import { getFarmPregnancyDiagnosisAlerts } from "../../../api/GoatFarmAPI/reproduction";

function resolveSeverity(daysOverdue: number): AlertSeverity {
  if (daysOverdue > 7) return "high";
  if (daysOverdue > 0) return "medium";
  return "low";
}

function resolvePriority(daysOverdue: number): number {
  if (daysOverdue > 0) {
    return 300 + Math.min(daysOverdue, 90);
  }

  return 200;
}

function toItem(farmId: number, goatId: string, eligibleDate: string, lastCoverageDate: string, daysOverdue: number): AlertItem {
  return {
    id: `${goatId}-${eligibleDate}`,
    source: "reproduction",
    title: `Diagnostico pendente: ${goatId}`,
    description: `Atraso de ${daysOverdue} dia(s). Cobertura em ${new Date(`${lastCoverageDate}T00:00:00`).toLocaleDateString("pt-BR")}`,
    date: eligibleDate,
    severity: resolveSeverity(daysOverdue),
    priority: resolvePriority(daysOverdue),
    goatId,
    daysOverdue,
    link: `/app/goatfarms/${farmId}/goats/${goatId}/reproduction`,
    actionLabel: "Ver reproducao"
  };
}

export const PregnancyDiagnosisAlertProvider: AlertProvider = {
  key: "reproduction_pregnancy_diagnosis",
  label: "Diagnostico de Prenhez",
  priority: 100,

  getSummary: async (farmId: number): Promise<AlertSummary> => {
    try {
      const response = await getFarmPregnancyDiagnosisAlerts(farmId, { page: 0, size: 5 });
      const count = response.totalPending;

      let headline: string | undefined;
      let worstOverdueDays = 0;

      if (response.alerts && response.alerts.length > 0) {
        worstOverdueDays = response.alerts.reduce(
          (max, item) => Math.max(max, item.daysOverdue),
          0
        );

        if (worstOverdueDays > 0) {
          headline = `Maior atraso: ${worstOverdueDays} dias`;
        } else {
          headline = "Diagnostico elegivel para hoje";
        }
      }

      return {
        count,
        headline,
        worstOverdueDays,
        previewItems: response.alerts.slice(0, 3).map((alert) =>
          toItem(
            farmId,
            alert.goatId,
            alert.eligibleDate,
            alert.lastCoverageDate,
            alert.daysOverdue
          )
        )
      };
    } catch (error) {
      console.error("Failed to fetch pregnancy diagnosis alerts summary", error);
      return { count: 0 };
    }
  },

  getList: async (farmId: number, params?: AlertListParams): Promise<AlertItem[]> => {
    try {
      const response = await getFarmPregnancyDiagnosisAlerts(farmId, params);
      return response.alerts.map((alert) =>
        toItem(
          farmId,
          alert.goatId,
          alert.eligibleDate,
          alert.lastCoverageDate,
          alert.daysOverdue
        )
      );
    } catch (error) {
      console.error("Failed to fetch pregnancy diagnosis alerts list", error);
      return [];
    }
  },

  getRoute: (farmId: number) => `/app/goatfarms/${farmId}/alerts?type=reproduction_pregnancy_diagnosis`
};
