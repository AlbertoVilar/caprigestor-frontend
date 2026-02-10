export interface LactationRequestDTO {
  startDate: string; // yyyy-MM-dd
}

export interface LactationDryRequestDTO {
  endDate: string; // yyyy-MM-dd
}

export type LactationStatus = "ACTIVE" | "DRY" | "CLOSED";

export interface LactationResponseDTO {
  id: number;
  farmId: number;
  goatId: string;
  status: LactationStatus;
  startDate: string;
  endDate?: string | null;
  pregnancyStartDate?: string | null;
  dryStartDate?: string | null;
}

export interface LactationSummaryDTO {
  lactation: {
    id: number;
    goatId: string;
    startDate: string;
    endDate?: string | null;
    status: LactationStatus;
  };
  production: {
    totalLiters: number;
    daysInLactation: number;
    daysMeasured: number;
    averagePerDay: number;
    peakLiters?: number | null;
    peakDate?: string | null;
  };
  pregnancy?: {
    gestationDays?: number | null;
    dryOffRecommendation?: boolean;
    recommendedDryOffDate?: string | null;
    message?: string | null;
  };
}

export interface LactationDryOffAlertItemDTO {
  lactationId?: number;
  goatId: string;
  startDatePregnancy: string;
  breedingDate?: string | null;
  confirmDate?: string | null;
  dryOffDate: string;
  dryAtPregnancyDays?: number;
  gestationDays: number;
  daysOverdue: number;
  dryOffRecommendation?: boolean;
}

export interface LactationDryOffAlertResponseDTO {
  totalPending: number;
  alerts: LactationDryOffAlertItemDTO[];
}
