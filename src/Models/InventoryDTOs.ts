export type InventoryMovementType = "IN" | "OUT" | "ADJUST";

export type InventoryAdjustDirection = "INCREASE" | "DECREASE";

export interface InventoryItem {
  id: number;
  name: string;
  trackLot: boolean;
  active: boolean;
}

export interface InventoryItemCreateRequest {
  name: string;
  trackLot?: boolean;
}

export interface InventoryPageMetadata {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface InventoryItemsPage {
  content: InventoryItem[];
  page: InventoryPageMetadata;
}

export interface InventoryMovementCreateRequestDTO {
  type: InventoryMovementType;
  quantity: number;
  itemId: number;
  lotId?: number;
  adjustDirection?: InventoryAdjustDirection;
  movementDate?: string;
  reason?: string;
}

export interface InventoryMovementResponseDTO {
  movementId: number;
  type: InventoryMovementType;
  quantity: number;
  itemId: number;
  lotId?: number | null;
  movementDate: string;
  resultingBalance: number;
  createdAt: string;
}

export interface InventoryMovementCommandResult {
  movement: InventoryMovementResponseDTO;
  idempotencyKey: string;
  responseStatus: number;
  replayed: boolean;
}
