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
