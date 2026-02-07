export type MilkingShift = "TOTAL_DAY" | "MORNING" | "AFTERNOON";
export type MilkProductionStatus = "ACTIVE" | "CANCELED";

export interface MilkProductionRequestDTO {
  date: string; // yyyy-MM-dd
  shift: MilkingShift;
  volumeLiters: number;
  notes?: string;
}

export interface MilkProductionUpdateRequestDTO {
  volumeLiters?: number;
  notes?: string;
}

export interface MilkProductionResponseDTO {
  id: number;
  date: string;
  shift: MilkingShift;
  volumeLiters: number;
  notes?: string | null;
  status: MilkProductionStatus;
  canceledAt?: string | null;
  canceledReason?: string | null;
}
