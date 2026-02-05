import { HealthEventResponseDTO } from "./HealthDTOs";

export interface HealthAlertsDTO {
  dueTodayCount: number;
  upcomingCount: number;
  overdueCount: number;
  
  dueTodayTop: HealthEventResponseDTO[];
  upcomingTop: HealthEventResponseDTO[];
  overdueTop: HealthEventResponseDTO[];
}
