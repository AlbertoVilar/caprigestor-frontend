import { HealthEventStatus, HealthEventType } from "../../Models/HealthDTOs";

export const HEALTH_EVENT_TYPE_LABELS: Record<HealthEventType, string> = {
  [HealthEventType.VACINA]: "Vacina\u00e7\u00e3o",
  [HealthEventType.VERMIFUGACAO]: "Vermifuga\u00e7\u00e3o",
  [HealthEventType.MEDICACAO]: "Medica\u00e7\u00e3o",
  [HealthEventType.PROCEDIMENTO]: "Procedimento",
  [HealthEventType.DOENCA]: "Doen\u00e7a/Ocorr\u00eancia",
};

export const HEALTH_EVENT_STATUS_LABELS: Record<HealthEventStatus, string> = {
  [HealthEventStatus.AGENDADO]: "Agendado",
  [HealthEventStatus.REALIZADO]: "Realizado",
  [HealthEventStatus.CANCELADO]: "Cancelado",
};
