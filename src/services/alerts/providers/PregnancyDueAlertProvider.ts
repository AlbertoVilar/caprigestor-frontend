import { AlertItem, AlertListParams, AlertProvider, AlertSeverity, AlertSummary } from "../AlertRegistry";
import { getFarmPendingBirthAlerts } from "../../../api/GoatFarmAPI/reproduction";

function resolveSeverity(daysOverdue: number): AlertSeverity {
  if (daysOverdue > 7) return "high";
  if (daysOverdue > 0) return "medium";
  return "low";
}

function resolvePriority(daysOverdue: number): number {
  if (daysOverdue > 0) return 400 + Math.min(daysOverdue, 90);
  return 300;
}

function toItem(
  farmId: number,
  pregnancyId: number,
  goatId: string,
  expectedDueDate: string,
  daysOverdue: number
): AlertItem {
  const dueDate = new Date(`${expectedDueDate}T00:00:00`).toLocaleDateString("pt-BR");
  const isOverdue = daysOverdue > 0;

  return {
    id: `pregnancy-due-${pregnancyId}`,
    source: "reproduction",
    title: isOverdue ? `Parto atrasado: ${goatId}` : `Parto previsto para hoje: ${goatId}`,
    description: isOverdue
      ? `Parto previsto para ${dueDate}; atraso de ${daysOverdue} dia(s).`
      : `Parto previsto para hoje (${dueDate}).`,
    date: expectedDueDate,
    severity: resolveSeverity(daysOverdue),
    priority: resolvePriority(daysOverdue),
    goatId,
    daysOverdue,
    link: `/app/goatfarms/${farmId}/goats/${goatId}/reproduction?action=register-birth`,
    actionLabel: "Registrar parto",
  };
}

export const PregnancyDueAlertProvider: AlertProvider = {
  key: "reproduction_birth_due",
  label: "Partos previstos/atrasados",
  priority: 110,

  getSummary: async (farmId: number): Promise<AlertSummary> => {
    try {
      const response = await getFarmPendingBirthAlerts(farmId, { page: 0, size: 5 });
      const worstOverdueDays = response.alerts.reduce(
        (maximum, alert) => Math.max(maximum, alert.daysOverdue),
        0
      );

      return {
        count: response.totalPending,
        headline: response.totalPending === 0
          ? undefined
          : worstOverdueDays > 0
            ? `Maior atraso: ${worstOverdueDays} dias`
            : "Parto previsto para hoje",
        worstOverdueDays,
        highestSeverity: response.totalPending > 0 ? resolveSeverity(worstOverdueDays) : undefined,
        previewItems: response.alerts.slice(0, 3).map((alert) =>
          toItem(farmId, alert.pregnancyId, alert.goatId, alert.expectedDueDate, alert.daysOverdue)
        ),
      };
    } catch (error) {
      console.error("Failed to fetch pending birth alerts summary", error);
      throw error;
    }
  },

  getList: async (farmId: number, params?: AlertListParams): Promise<AlertItem[]> => {
    try {
      const response = await getFarmPendingBirthAlerts(farmId, params);
      return response.alerts.map((alert) =>
        toItem(farmId, alert.pregnancyId, alert.goatId, alert.expectedDueDate, alert.daysOverdue)
      );
    } catch (error) {
      console.error("Failed to fetch pending birth alerts list", error);
      throw error;
    }
  },

  getRoute: (farmId: number) => `/app/goatfarms/${farmId}/alerts?type=reproduction_birth_due`,
};
