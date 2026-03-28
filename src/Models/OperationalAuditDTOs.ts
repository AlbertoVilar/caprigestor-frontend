export type OperationalAuditActionType =
  | "GOAT_EXIT"
  | "ANIMAL_SALE_CREATED"
  | "ANIMAL_SALE_PAYMENT_REGISTERED"
  | "MILK_SALE_CREATED"
  | "MILK_SALE_PAYMENT_REGISTERED";

export interface OperationalAuditEntryDTO {
  id: number;
  goatRegistrationNumber?: string | null;
  actionType: OperationalAuditActionType;
  actionLabel: string;
  targetId?: string | null;
  description: string;
  actorUserId: number;
  actorName: string;
  actorEmail: string;
  createdAt: string;
}
