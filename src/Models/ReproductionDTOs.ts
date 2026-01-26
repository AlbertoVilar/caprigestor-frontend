export type BreedingType = "NATURAL" | "AI";

export type PregnancyCheckResult = "PENDING" | "POSITIVE" | "NEGATIVE";

export type PregnancyStatus = "ACTIVE" | "CLOSED";

export type PregnancyCloseReason =
  | "BIRTH"
  | "ABORTION"
  | "LOSS"
  | "OTHER"
  | "DATA_FIX_DUPLICATED_ACTIVE";

export type ReproductiveEventType =
  | "COVERAGE"
  | "PREGNANCY_CHECK"
  | "PREGNANCY_CLOSE";

export interface BreedingRequestDTO {
  eventDate: string; // yyyy-MM-dd
  breedingType: BreedingType;
  breederRef?: string;
  notes?: string;
}

export interface PregnancyConfirmRequestDTO {
  checkDate: string; // yyyy-MM-dd
  checkResult: PregnancyCheckResult;
  notes?: string;
}

export interface PregnancyCloseRequestDTO {
  closeDate: string; // yyyy-MM-dd
  status: PregnancyStatus;
  closeReason?: PregnancyCloseReason;
  notes?: string;
}

export interface PregnancyResponseDTO {
  id: number;
  farmId: number;
  goatId: string;
  status: PregnancyStatus;
  breedingDate?: string | null;
  confirmDate?: string | null;
  expectedDueDate?: string | null;
  closedAt?: string | null;
  closeReason?: PregnancyCloseReason | null;
  notes?: string | null;
}

export interface ReproductiveEventResponseDTO {
  id: number;
  farmId: number;
  goatId: string;
  pregnancyId?: number | null;
  eventType: ReproductiveEventType;
  eventDate: string;
  breedingType?: BreedingType | null;
  breederRef?: string | null;
  notes?: string | null;
  checkScheduledDate?: string | null;
  checkResult?: PregnancyCheckResult | null;
}
