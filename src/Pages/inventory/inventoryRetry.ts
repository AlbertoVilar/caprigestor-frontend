import {
  createInventoryIdempotencyKey,
  createInventoryPayloadHash,
} from "../../api/GoatFarmAPI/inventory";
import type { InventoryMovementCreateRequestDTO } from "../../Models/InventoryDTOs";

export type InventoryRetrySnapshot = {
  farmId: number;
  idempotencyKey: string;
  payloadHash: string;
  payload: InventoryMovementCreateRequestDTO;
  createdAt: string;
};

type InventoryDraftKeyState = {
  currentKey: string | null;
  currentPayloadHash: string | null;
  nextPayload: InventoryMovementCreateRequestDTO;
};

const STORAGE_KEY_PREFIX = "inventory-retry";

const getStorageKey = (farmId: number) => `${STORAGE_KEY_PREFIX}:${farmId}`;

const hasSessionStorage = () =>
  typeof globalThis.sessionStorage !== "undefined" && globalThis.sessionStorage !== null;

export const createInventoryRetrySnapshot = (
  farmId: number,
  payload: InventoryMovementCreateRequestDTO,
  idempotencyKey = createInventoryIdempotencyKey()
): InventoryRetrySnapshot => ({
  farmId,
  idempotencyKey,
  payloadHash: createInventoryPayloadHash(payload),
  payload,
  createdAt: new Date().toISOString(),
});

export const isSameInventoryRetryPayload = (
  snapshot: Pick<InventoryRetrySnapshot, "payloadHash">,
  payload: InventoryMovementCreateRequestDTO
): boolean => snapshot.payloadHash === createInventoryPayloadHash(payload);

export const syncInventoryDraftKey = ({
  currentKey,
  currentPayloadHash,
  nextPayload,
}: InventoryDraftKeyState): { idempotencyKey: string; payloadHash: string; changed: boolean } => {
  const nextPayloadHash = createInventoryPayloadHash(nextPayload);

  if (currentKey && currentPayloadHash === nextPayloadHash) {
    return {
      idempotencyKey: currentKey,
      payloadHash: nextPayloadHash,
      changed: false,
    };
  }

  return {
    idempotencyKey: createInventoryIdempotencyKey(),
    payloadHash: nextPayloadHash,
    changed: true,
  };
};

export const saveInventoryRetrySnapshot = (snapshot: InventoryRetrySnapshot): void => {
  if (!hasSessionStorage()) return;
  globalThis.sessionStorage.setItem(getStorageKey(snapshot.farmId), JSON.stringify(snapshot));
};

export const loadInventoryRetrySnapshot = (
  farmId: number
): InventoryRetrySnapshot | null => {
  if (!hasSessionStorage()) return null;

  const rawValue = globalThis.sessionStorage.getItem(getStorageKey(farmId));
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as InventoryRetrySnapshot;
    if (
      parsed &&
      parsed.farmId === farmId &&
      typeof parsed.idempotencyKey === "string" &&
      typeof parsed.payloadHash === "string" &&
      parsed.payload
    ) {
      return parsed;
    }
  } catch {
    // Ignore malformed session data and let the UI continue with a fresh key.
  }

  return null;
};

export const clearInventoryRetrySnapshot = (farmId: number): void => {
  if (!hasSessionStorage()) return;
  globalThis.sessionStorage.removeItem(getStorageKey(farmId));
};
