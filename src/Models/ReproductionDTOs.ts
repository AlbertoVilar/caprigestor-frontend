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
  | "COVERAGE_CORRECTION"
  | "PREGNANCY_CHECK"
  | "PREGNANCY_CLOSE"
  | "WEANING";

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

export type BirthKidGender = "MACHO" | "FEMEA" | "MALE" | "FEMALE";
export type BirthKidCategory = "PO" | "PA" | "PC";

export interface BirthKidRequestDTO {
  registrationNumber: string;
  name: string;
  gender: BirthKidGender;
  breed?: string;
  color?: string;
  birthDate?: string; // yyyy-MM-dd
  category?: BirthKidCategory;
}

export interface BirthRequestDTO {
  birthDate: string; // yyyy-MM-dd
  fatherRegistrationNumber?: string;
  notes?: string;
  kids: BirthKidRequestDTO[];
}

export interface BirthKidResponseDTO {
  registrationNumber: string;
  name: string;
  gender: string;
  breed?: string | null;
  color?: string | null;
  birthDate?: string | null;
  status?: string | null;
  category?: string | null;
  fatherRegistrationNumber?: string | null;
  motherRegistrationNumber?: string | null;
}

export interface BirthResponseDTO {
  pregnancy: PregnancyResponseDTO;
  closeEvent: ReproductiveEventResponseDTO;
  kids: BirthKidResponseDTO[];
}

export interface WeaningRequestDTO {
  weaningDate: string; // yyyy-MM-dd
  notes?: string;
}

export interface WeaningResponseDTO {
  goatId: string;
  weaningDate: string;
  previousStatus: string;
  currentStatus: string;
  event?: ReproductiveEventResponseDTO | null;
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
