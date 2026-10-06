export type OwnershipEntryType =
  | "BIRTH"
  | "MANUAL_IMPORT"
  | "ABCC_IMPORT"
  | "PURCHASE"
  | "TRANSFER_IN"
  | "RETURN"
  | "EXTERNAL_CLAIM";

export type OwnershipExitType =
  | "TRANSFER_OUT"
  | "EXTERNAL_SALE"
  | "DONATION"
  | "DEATH"
  | "RETIREMENT";

export interface OwnershipHistoryPeriodDTO {
  farmId: number;
  startedAt: string;
  endedAt: string | null;
  entryType: OwnershipEntryType;
  exitType: OwnershipExitType | null;
  current: boolean;
}

export interface OwnershipHistoryResponseDTO {
  goatId: number;
  periods: OwnershipHistoryPeriodDTO[];
}
