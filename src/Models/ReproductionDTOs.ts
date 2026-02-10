export type BreedingType = "NATURAL" | "AI";

export type PregnancyCheckResult = "PENDING" | "POSITIVE" | "NEGATIVE";

export type PregnancyStatus = "ACTIVE" | "CLOSED";
export type DiagnosisRecommendationStatus =
  | "NOT_ELIGIBLE"
  | "ELIGIBLE_PENDING"
  | "RESOLVED";

export type PregnancyCloseReason =
  | "BIRTH"
  | "ABORTION"
  | "LOSS"
  | "FALSE_POSITIVE"
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
  checkResult: "POSITIVE";
  notes?: string;
}

export interface PregnancyCheckRequestDTO {
  checkDate: string; // yyyy-MM-dd
  checkResult: "NEGATIVE";
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
  closeDate?: string | null;
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

export interface DiagnosisRecommendationCoverageDTO {
  id: number;
  eventDate: string;
  effectiveDate: string;
  breedingType?: BreedingType | null;
  breederRef?: string | null;
  notes?: string | null;
}

export interface DiagnosisRecommendationCheckDTO {
  id: number;
  checkDate: string;
  checkResult: PregnancyCheckResult;
  notes?: string | null;
}

export interface DiagnosisRecommendationResponseDTO {
  status: DiagnosisRecommendationStatus;
  eligibleDate?: string | null;
  lastCoverage?: DiagnosisRecommendationCoverageDTO | null;
  lastCheck?: DiagnosisRecommendationCheckDTO | null;
  warnings?: string[] | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PregnancyDiagnosisAlertItemDTO {
  goatId: string;
  eligibleDate: string;
  daysOverdue: number;
  lastCoverageDate: string;
  lastCheckDate?: string | null;
}

export interface PregnancyDiagnosisAlertResponseDTO {
  totalPending: number;
  alerts: PregnancyDiagnosisAlertItemDTO[];
}
