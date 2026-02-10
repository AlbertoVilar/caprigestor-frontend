import { AlertProvider, AlertSummary } from "../AlertRegistry";
import { healthAPI } from "../../../api/GoatFarmAPI/health";

export const HealthAlertProvider: AlertProvider = {
  key: 'health_agenda',
  label: 'Agenda Sanitária',
  priority: 80, // Lower priority than Reproduction? Or depends.

  getSummary: async (farmId: number): Promise<AlertSummary> => {
    try {
      const data = await healthAPI.getAlerts(farmId);
      const overdueCount = data.overdueCount || 0;
      const dueTodayCount = data.dueTodayCount || 0;
      const count = overdueCount + dueTodayCount;

      let headline = undefined;
      if (overdueCount > 0) {
        headline = `${overdueCount} atrasado(s)`;
      } else if (dueTodayCount > 0) {
        headline = `${dueTodayCount} para hoje`;
      }

      return {
        count,
        headline,
        worstOverdueDays: 0 // API doesn't give this easily in summary, skipping
      };
    } catch (error) {
      console.error("Failed to fetch health alerts", error);
      return { count: 0 };
    }
  },

  // List is not implemented here because we redirect to the Agenda page
  getRoute: (farmId: number) => `/app/goatfarms/${farmId}/health-agenda`
};
