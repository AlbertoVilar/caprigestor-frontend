export type OwnershipTransferKind = "INTERNAL_TRANSFER";

export type OwnershipTransferStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type OwnershipTransferDirection = "INCOMING" | "OUTGOING";

export interface InternalOwnershipTransferRequestDTO {
  goatId: number;
  targetFarmId: number;
  reason: string;
  idempotencyKey: string;
}

export interface OwnershipTransferResponseDTO {
  id: number;
  goatId: number;
  sourceFarmId: number;
  targetFarmId: number;
  kind: OwnershipTransferKind;
  status: OwnershipTransferStatus;
  reason: string;
  requestedAt: string;
  acceptedAt: string | null;
  effectiveAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface OwnershipTransferPageDTO {
  content: OwnershipTransferResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
