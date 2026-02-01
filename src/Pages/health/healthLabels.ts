import { HealthEventStatus, HealthEventType } from "../../Models/HealthDTOs";

export const HEALTH_EVENT_TYPE_LABELS: Record<HealthEventType, string> = {
  [HealthEventType.VACINA]: "Vacinação",
  [HealthEventType.VERMIFUGACAO]: "Vermifugação",
  [HealthEventType.MEDICACAO]: "Medicação",
  [HealthEventType.PROCEDIMENTO]: "Procedimento",
  [HealthEventType.DOENCA]: "Doença/Ocorrência"
};

export const HEALTH_EVENT_STATUS_LABELS: Record<HealthEventStatus, string> = {
  [HealthEventStatus.AGENDADO]: "Agendado",
  [HealthEventStatus.REALIZADO]: "Realizado",
  [HealthEventStatus.CANCELADO]: "Cancelado"
};
