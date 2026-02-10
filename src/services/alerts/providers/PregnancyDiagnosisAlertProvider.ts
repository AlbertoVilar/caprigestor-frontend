import { AlertProvider, AlertSummary, AlertItem, AlertListParams } from "../AlertRegistry";
import { getFarmPregnancyDiagnosisAlerts } from "../../../api/GoatFarmAPI/reproduction";

export const PregnancyDiagnosisAlertProvider: AlertProvider = {
  key: 'reproduction_pregnancy_diagnosis',
  label: 'Diagnóstico de Prenhez',
  priority: 100, // High priority

  getSummary: async (farmId: number): Promise<AlertSummary> => {
    try {
      const response = await getFarmPregnancyDiagnosisAlerts(farmId, { page: 0, size: 1 });
      const count = response.totalPending;
      
      let headline = undefined;
      let worstOverdueDays = 0;

      // Calculate worst overdue if available
      // Since the API returns sorted by overdue desc (usually), we check the first item
      // But let's verify logic. The API returns a list.
      if (response.alerts && response.alerts.length > 0) {
        // Find max daysOverdue in the first batch (or trust backend sorting)
        // Assuming backend sorts by overdue descending
        const worst = response.alerts.reduce((max, item) => Math.max(max, item.daysOverdue), 0);
        worstOverdueDays = worst;
        if (worst > 0) {
            headline = `Maior atraso: ${worst} dias`;
        }
      }

      return {
        count,
        headline,
        worstOverdueDays
      };
    } catch (error) {
      console.error("Failed to fetch pregnancy diagnosis alerts summary", error);
      return { count: 0 };
    }
  },

  getList: async (farmId: number, params?: AlertListParams): Promise<AlertItem[]> => {
    try {
        const response = await getFarmPregnancyDiagnosisAlerts(farmId, params);
        return response.alerts.map(alert => ({
            id: `${alert.goatId}-${alert.eligibleDate}`,
            title: `Diagnóstico Pendente: ${alert.goatId}`,
            description: `Atraso de ${alert.daysOverdue} dias. Cobertura em ${new Date(alert.lastCoverageDate).toLocaleDateString()}`,
            date: alert.eligibleDate,
            severity: alert.daysOverdue > 30 ? 'high' : 'medium',
            goatId: alert.goatId,
            link: `/app/goatfarms/${farmId}/goats/${alert.goatId}/reproduction`
        }));
    } catch (error) {
        console.error("Failed to fetch pregnancy diagnosis alerts list", error);
        return [];
    }
  },

  getRoute: (farmId: number) => `/app/goatfarms/${farmId}/alerts?type=reproduction_pregnancy_diagnosis`
};
