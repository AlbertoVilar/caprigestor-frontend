import { requestBackEnd } from "../../utils/request";
import type {
  InventoryBalancesPage,
  InventoryItem,
  InventoryItemCreateRequest,
  InventoryItemsPage,
  InventoryLot,
  InventoryLotActivationRequest,
  InventoryLotCreateRequest,
  InventoryLotsPage,
  InventoryMovementCommandResult,
  InventoryMovementCreateRequestDTO,
  InventoryMovementHistoryPage,
  InventoryMovementType,
  InventoryMovementResponseDTO,
} from "../../Models/InventoryDTOs";

type Envelope<T> = { data: T } | T;

const unwrap = <T>(data: Envelope<T>): T =>
  (data as { data?: T }).data ?? (data as T);

const getMovementBaseUrl = (farmId: number) =>
  `/goatfarms/${farmId}/inventory/movements`;

const getItemsBaseUrl = (farmId: number) => `/goatfarms/${farmId}/inventory/items`;

const getBalancesBaseUrl = (farmId: number) =>
  `/goatfarms/${farmId}/inventory/balances`;

const getLotsBaseUrl = (farmId: number) => `/goatfarms/${farmId}/inventory/lots`;

type InventoryBalancesQuery = {
  itemId?: number;
  lotId?: number;
  activeOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

type InventoryMovementHistoryQuery = {
  itemId?: number;
  lotId?: number;
  type?: InventoryMovementType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
};

type InventoryLotsQuery = {
  itemId?: number;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export const normalizeInventoryItemPayload = (
  request: InventoryItemCreateRequest
): InventoryItemCreateRequest => ({
  name: request.name.trim(),
  ...(request.trackLot != null ? { trackLot: request.trackLot } : {}),
});

export const normalizeInventoryLotPayload = (
  request: InventoryLotCreateRequest
): InventoryLotCreateRequest => ({
  itemId: request.itemId,
  code: request.code.trim(),
  ...(request.description?.trim() ? { description: request.description.trim() } : {}),
  ...(request.expirationDate ? { expirationDate: request.expirationDate } : {}),
  ...(request.active != null ? { active: request.active } : {}),
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
  ...(request.unitCost != null ? { unitCost: request.unitCost } : {}),
  ...(request.totalCost != null ? { totalCost: request.totalCost } : {}),
  ...(request.purchaseDate ? { purchaseDate: request.purchaseDate } : {}),
  ...(request.supplierName?.trim() ? { supplierName: request.supplierName.trim() } : {}),
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

export async function listInventoryLots(
  farmId: number,
  query: InventoryLotsQuery = {}
): Promise<InventoryLotsPage> {
  const response = await requestBackEnd.get<Envelope<InventoryLotsPage>>(getLotsBaseUrl(farmId), {
    params: {
      page: query.page ?? 0,
      size: query.size ?? 100,
      ...(query.itemId != null ? { itemId: query.itemId } : {}),
      ...(query.active != null ? { active: query.active } : {}),
      ...(query.sort ? { sort: query.sort } : {}),
    },
  });

  return unwrap<InventoryLotsPage>(response.data);
}

export async function createInventoryLot(
  farmId: number,
  request: InventoryLotCreateRequest
): Promise<InventoryLot> {
  const response = await requestBackEnd.post<Envelope<InventoryLot>>(
    getLotsBaseUrl(farmId),
    normalizeInventoryLotPayload(request)
  );

  return unwrap<InventoryLot>(response.data);
}

export async function updateInventoryLotActive(
  farmId: number,
  lotId: number,
  request: InventoryLotActivationRequest
): Promise<InventoryLot> {
  const response = await requestBackEnd.patch<Envelope<InventoryLot>>(
    `${getLotsBaseUrl(farmId)}/${lotId}/active`,
    request
  );

  return unwrap<InventoryLot>(response.data);
}

export async function listInventoryBalances(
  farmId: number,
  query: InventoryBalancesQuery = {}
): Promise<InventoryBalancesPage> {
  const response = await requestBackEnd.get<Envelope<InventoryBalancesPage>>(
    getBalancesBaseUrl(farmId),
    {
      params: {
        page: query.page ?? 0,
        size: query.size ?? 20,
        activeOnly: query.activeOnly ?? true,
        ...(query.itemId != null ? { itemId: query.itemId } : {}),
        ...(query.lotId != null ? { lotId: query.lotId } : {}),
        ...(query.sort ? { sort: query.sort } : {}),
      },
    }
  );

  return unwrap<InventoryBalancesPage>(response.data);
}

export async function listInventoryMovements(
  farmId: number,
  query: InventoryMovementHistoryQuery = {}
): Promise<InventoryMovementHistoryPage> {
  const response = await requestBackEnd.get<Envelope<InventoryMovementHistoryPage>>(
    getMovementBaseUrl(farmId),
    {
      params: {
        page: query.page ?? 0,
        size: query.size ?? 20,
        ...(query.itemId != null ? { itemId: query.itemId } : {}),
        ...(query.lotId != null ? { lotId: query.lotId } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.fromDate ? { fromDate: query.fromDate } : {}),
        ...(query.toDate ? { toDate: query.toDate } : {}),
        ...(query.sort ? { sort: query.sort } : {}),
      },
    }
  );

  return unwrap<InventoryMovementHistoryPage>(response.data);
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
