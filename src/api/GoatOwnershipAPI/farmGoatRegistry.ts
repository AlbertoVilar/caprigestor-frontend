import { requestBackEnd } from "../../utils/request";
import type { FarmGoatRegistryResponseDTO } from "../../Models/FarmGoatRegistryDTOs";

export class InvalidFarmIdError extends Error {
  constructor() {
    super("A farmId must be a positive safe integer.");
    this.name = "InvalidFarmIdError";
  }
}

export function isValidStructuralFarmId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export async function getFarmGoatRegistry(
  farmId: number
): Promise<FarmGoatRegistryResponseDTO[]> {
  if (!isValidStructuralFarmId(farmId)) {
    throw new InvalidFarmIdError();
  }

  const { data } = await requestBackEnd.get<FarmGoatRegistryResponseDTO[]>(
    `/goatfarms/${farmId}/goat-registry`
  );
  return data;
}
