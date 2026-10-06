export type OwnershipMovementDirection = "INCOMING" | "OUTGOING";

export type OwnershipMovementKind = "INTERNAL_TRANSFER" | "INTERNAL_SALE";

export type OwnershipMovementStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface OwnershipMovementDTO {
  movementId: number;
  goatId: number;
  goatName?: string | null;
  goatRegistrationNumber?: string | null;
  sourceFarmId: number | null;
  sourceFarmName?: string | null;
  targetFarmId: number;
  targetFarmName?: string | null;
  movementKind: OwnershipMovementKind;
  status: OwnershipMovementStatus;
  direction: OwnershipMovementDirection;
  reason: string | null;
  requestedAt: string;
  acceptedAt: string | null;
  effectiveAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  realized: boolean;
  saleId: number | null;
  saleDate: string | null;
  amount: number | null;
  paymentStatus: string | null;
  paymentDate: string | null;
}

export interface OwnershipMovementPageDTO {
  content: OwnershipMovementDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
