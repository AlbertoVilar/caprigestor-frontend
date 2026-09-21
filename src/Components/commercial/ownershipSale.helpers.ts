import type { GoatFarmDTO } from "../../Models/goatFarm";

export type OwnershipSaleIntent = {
  fingerprint: string;
  key: string;
};

export type OwnershipSaleIntentInput = {
  goatId: string;
  targetFarmId: number;
  customerId: number;
  saleDate: string;
  amount: number;
  dueDate: string;
};

export function getEligibleBuyerFarms(farms: GoatFarmDTO[], sourceFarmId: number): GoatFarmDTO[] {
  return farms.filter((farm) => farm.id !== sourceFarmId);
}

export function resolveDefaultBuyerFarmId(farms: GoatFarmDTO[]): number {
  return farms.length === 1 ? farms[0].id : 0;
}

export function createOwnershipSaleIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOwnershipSaleIntent({
  current,
  input,
  createKey = createOwnershipSaleIdempotencyKey,
}: {
  current: OwnershipSaleIntent | null;
  input: OwnershipSaleIntentInput;
  createKey?: () => string;
}): OwnershipSaleIntent {
  const fingerprint = [
    input.goatId,
    input.targetFarmId,
    input.customerId,
    input.saleDate,
    input.amount,
    input.dueDate,
  ].join("|");

  if (current?.fingerprint === fingerprint) {
    return current;
  }

  return { fingerprint, key: createKey() };
}
