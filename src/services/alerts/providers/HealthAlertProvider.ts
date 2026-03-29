import { AlertItem, AlertProvider, AlertSummary } from "../AlertRegistry";
import { healthAPI } from "../../../api/GoatFarmAPI/health";
import type { WithdrawalAlertItemDTO } from "../../../Models/HealthAlertsDTO";
import type { HealthEventResponseDTO } from "../../../Models/HealthDTOs";

function toHealthItem(
  farmId: number,
  event: HealthEventResponseDTO,
  category: "overdue" | "due_today" | "upcoming"
): AlertItem {
  const severity = category === "overdue" ? "high" : category === "due_today" ? "medium" : "low";
  const priority = category === "overdue" ? 350 : category === "due_today" ? 240 : 120;

  const categoryText =
    category === "overdue"
      ? "Evento sanitario atrasado"
      : category === "due_today"
        ? "Evento sanitario para hoje"
        : "Evento sanitario proximo";

  return {
    id: `health-${event.id}-${category}`,
    source: "health",
    title: event.title || "Evento sanitario",
    description: `${categoryText} · Cabra ${event.goatId}`,
    date: event.scheduledDate,
    severity,
    priority,
    goatId: event.goatId,
    link: `/app/goatfarms/${farmId}/goats/${event.goatId}/health/${event.id}`,
    actionLabel: "Ver evento"
  };
}

function toWithdrawalItem(
  farmId: number,
  item: WithdrawalAlertItemDTO,
  withdrawalType: "milk" | "meat"
): AlertItem {
  return {
    id: `health-withdrawal-${withdrawalType}-${item.eventId}`,
    source: "health",
    title: withdrawalType === "milk" ? "Carencia de leite ativa" : "Carencia de carne ativa",
    description: `Cabra ${item.goatId} · bloqueio ate ${item.withdrawalEndDate}`,
    date: item.withdrawalEndDate,
    severity: withdrawalType === "milk" ? "high" : "medium",
    priority: withdrawalType === "milk" ? 420 : 280,
    goatId: item.goatId,
    link: `/app/goatfarms/${farmId}/goats/${item.goatId}/health/${item.eventId}`,
    actionLabel: "Ver tratamento"
  };
}

export const HealthAlertProvider: AlertProvider = {
  key: "health_agenda",
  label: "Agenda Sanitaria",
  priority: 80,

  getSummary: async (farmId: number): Promise<AlertSummary> => {
    try {
      const data = await healthAPI.getAlerts(farmId);
      const overdueCount = data.overdueCount || 0;
      const dueTodayCount = data.dueTodayCount || 0;
      const upcomingCount = data.upcomingCount || 0;
      const milkWithdrawalCount = data.activeMilkWithdrawalCount || 0;
      const meatWithdrawalCount = data.activeMeatWithdrawalCount || 0;
      const count = overdueCount + dueTodayCount + upcomingCount + milkWithdrawalCount + meatWithdrawalCount;

      let headline: string | undefined;
      if (overdueCount > 0) {
        headline = `${overdueCount} atrasado(s)`;
      } else if (milkWithdrawalCount > 0) {
        headline = `${milkWithdrawalCount} em carencia de leite`;
      } else if (meatWithdrawalCount > 0) {
        headline = `${meatWithdrawalCount} em carencia de carne`;
      } else if (dueTodayCount > 0) {
        headline = `${dueTodayCount} para hoje`;
      } else if (upcomingCount > 0) {
        headline = `${upcomingCount} proximo(s)`;
      }

      return {
        count,
        headline,
        worstOverdueDays: overdueCount > 0 ? 1 : 0
      };
    } catch (error) {
      console.error("Failed to fetch health alerts", error);
      return { count: 0 };
    }
  },

  getList: async (farmId: number): Promise<AlertItem[]> => {
    try {
      const data = await healthAPI.getAlerts(farmId);

      return [
        ...(data.milkWithdrawalTop || []).map((item) => toWithdrawalItem(farmId, item, "milk")),
        ...(data.meatWithdrawalTop || []).map((item) => toWithdrawalItem(farmId, item, "meat")),
        ...(data.overdueTop || []).map((event) => toHealthItem(farmId, event, "overdue")),
        ...(data.dueTodayTop || []).map((event) => toHealthItem(farmId, event, "due_today")),
        ...(data.upcomingTop || []).map((event) => toHealthItem(farmId, event, "upcoming"))
      ];
    } catch (error) {
      console.error("Failed to fetch health alert list", error);
      return [];
    }
  },

  getRoute: (farmId: number) => `/app/goatfarms/${farmId}/alerts?type=health_agenda`
};