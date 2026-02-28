import { requestBackEnd } from "../../utils/request";
import type {
  InventoryMovementCommandResult,
  InventoryMovementCreateRequestDTO,
  InventoryMovementResponseDTO,
} from "../../Models/InventoryDTOs";

type Envelope<T> = { data: T } | T;

const unwrap = <T>(data: Envelope<T>): T =>
  (data as { data?: T }).data ?? (data as T);

const getBaseUrl = (farmId: number) =>
  `/goatfarms/${farmId}/inventory/movements`;

export const normalizeInventoryMovementPayload = (
  request: InventoryMovementCreateRequestDTO
): InventoryMovementCreateRequestDTO => ({
  type: request.type,
  quantity: request.quantity,
  itemId: request.itemId,
  ...(request.lotId != null ? { lotId: request.lotId } : {}),
  ...(request.adjustDirection ? { adjustDirection: request.adjustDirection } : {}),
  ...(request.movementDate ? { movementDate: request.movementDate } : {}),
  ...(request.reason?.trim() ? { reason: request.reason.trim() } : {}),
});

export const createInventoryPayloadHash = (
  request: InventoryMovementCreateRequestDTO
): string => JSON.stringify(normalizeInventoryMovementPayload(request));

export const createInventoryIdempotencyKey = (): string => {
  const cryptoApi = globalThis.crypto as { randomUUID?: () => string } | undefined;

  if (cryptoApi?.randomUUID) {
    return `inventory-${cryptoApi.randomUUID()}`;
  }

  return `inventory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export async function createInventoryMovement(
  farmId: number,
  request: InventoryMovementCreateRequestDTO,
  options: { idempotencyKey?: string } = {}
): Promise<InventoryMovementCommandResult> {
  const idempotencyKey = options.idempotencyKey ?? createInventoryIdempotencyKey();
  const response = await requestBackEnd.post(
    getBaseUrl(farmId),
    normalizeInventoryMovementPayload(request),
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return {
    movement: unwrap<InventoryMovementResponseDTO>(response.data),
    idempotencyKey,
    responseStatus: response.status,
    replayed: response.status === 200,
  };
}
