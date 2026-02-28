import { requestBackEnd } from "../../utils/request";
import type {
  InventoryItem,
  InventoryItemCreateRequest,
  InventoryItemsPage,
  InventoryMovementCommandResult,
  InventoryMovementCreateRequestDTO,
  InventoryMovementResponseDTO,
} from "../../Models/InventoryDTOs";

type Envelope<T> = { data: T } | T;

const unwrap = <T>(data: Envelope<T>): T =>
  (data as { data?: T }).data ?? (data as T);

const getMovementBaseUrl = (farmId: number) =>
  `/goatfarms/${farmId}/inventory/movements`;

const getItemsBaseUrl = (farmId: number) => `/goatfarms/${farmId}/inventory/items`;

export const normalizeInventoryItemPayload = (
  request: InventoryItemCreateRequest
): InventoryItemCreateRequest => ({
  name: request.name.trim(),
  ...(request.trackLot != null ? { trackLot: request.trackLot } : {}),
});

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

export async function listInventoryItems(
  farmId: number,
  page = 0,
  size = 100,
  activeOnly?: boolean
): Promise<InventoryItemsPage> {
  const response = await requestBackEnd.get<Envelope<InventoryItemsPage>>(getItemsBaseUrl(farmId), {
    params: {
      page,
      size,
      ...(activeOnly != null ? { activeOnly } : {}),
    },
  });

  return unwrap<InventoryItemsPage>(response.data);
}

export async function createInventoryItem(
  farmId: number,
  request: InventoryItemCreateRequest
): Promise<InventoryItem> {
  const response = await requestBackEnd.post<Envelope<InventoryItem>>(
    getItemsBaseUrl(farmId),
    normalizeInventoryItemPayload(request)
  );

  return unwrap<InventoryItem>(response.data);
}

export async function createInventoryMovement(
  farmId: number,
  request: InventoryMovementCreateRequestDTO,
  options: { idempotencyKey?: string } = {}
): Promise<InventoryMovementCommandResult> {
  const idempotencyKey = options.idempotencyKey ?? createInventoryIdempotencyKey();
  const response = await requestBackEnd.post(
    getMovementBaseUrl(farmId),
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
