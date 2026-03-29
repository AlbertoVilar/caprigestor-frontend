import { HealthEventResponseDTO } from "./HealthDTOs";

export interface WithdrawalAlertItemDTO {
  eventId: number;
  goatId: string;
  title?: string;
  productName?: string;
  activeIngredient?: string;
  performedDate?: string;
  withdrawalEndDate: string;
  daysRemaining: number;
}

export interface HealthAlertsDTO {
  dueTodayCount: number;
  upcomingCount: number;
  overdueCount: number;
  activeMilkWithdrawalCount: number;
  activeMeatWithdrawalCount: number;
  
  dueTodayTop: HealthEventResponseDTO[];
  upcomingTop: HealthEventResponseDTO[];
  overdueTop: HealthEventResponseDTO[];
  milkWithdrawalTop: WithdrawalAlertItemDTO[];
  meatWithdrawalTop: WithdrawalAlertItemDTO[];
}
