export enum HealthEventType {
  VACINA = 'VACINA',
  VERMIFUGACAO = 'VERMIFUGACAO',
  MEDICACAO = 'MEDICACAO',
  PROCEDIMENTO = 'PROCEDIMENTO',
  DOENCA = 'DOENCA'
}

export enum HealthEventStatus {
  AGENDADO = 'AGENDADO',
  REALIZADO = 'REALIZADO',
  CANCELADO = 'CANCELADO'
}

export enum DoseUnit {
  ML = 'ML',
  MG = 'MG',
  G = 'G',
  UI = 'UI',
  TABLET = 'TABLET',
  FRASCO = 'FRASCO',
  DOSE = 'DOSE',
  OUTRO = 'OUTRO'
}

export enum AdministrationRoute {
  IM = 'IM',
  SC = 'SC',
  IV = 'IV',
  VO = 'VO',
  TOPICA = 'TOPICA',
  INTRAMAMARIA = 'INTRAMAMARIA',
  OUTRO = 'OUTRO'
}

export interface HealthEventCreateRequestDTO {
  type: HealthEventType;
  title: string;
  description?: string;
  scheduledDate: string; // YYYY-MM-DD
  notes?: string;
  productName?: string;
  activeIngredient?: string;
  dose?: number;
  doseUnit?: DoseUnit;
  route?: AdministrationRoute;
  batchNumber?: string;
  withdrawalMilkDays?: number;
  withdrawalMeatDays?: number;
}

export interface HealthEventUpdateRequestDTO {
  type: HealthEventType;
  title: string;
  description?: string;
  scheduledDate: string;
  notes?: string;
  productName?: string;
  activeIngredient?: string;
  dose?: number;
  doseUnit?: DoseUnit;
  route?: AdministrationRoute;
  batchNumber?: string;
  withdrawalMilkDays?: number;
  withdrawalMeatDays?: number;
}

export interface HealthEventDoneRequestDTO {
  performedAt: string; // ISO DateTime
  responsible: string;
  notes?: string;
}

export interface HealthEventCancelRequestDTO {
  notes: string;
}

export interface HealthEventResponseDTO {
  id: number;
  farmId: number;
  goatId: string;
  type: HealthEventType;
  status: HealthEventStatus;
  title: string;
  description?: string;
  scheduledDate: string;
  performedAt?: string;
  responsible?: string;
  notes?: string;
  productName?: string;
  activeIngredient?: string;
  dose?: number;
  doseUnit?: DoseUnit;
  route?: AdministrationRoute;
  batchNumber?: string;
  withdrawalMilkDays?: number;
  withdrawalMeatDays?: number;
  createdAt?: string;
  updatedAt?: string;
  overdue: boolean;
}
