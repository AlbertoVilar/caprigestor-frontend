import { requestBackEnd } from "../../utils/request";
import type { OwnershipHistoryResponseDTO } from "../../Models/GoatOwnershipHistoryDTOs";

export class InvalidGoatIdError extends Error {
  constructor() {
    super("A structural GoatId must be a positive safe integer.");
    this.name = "InvalidGoatIdError";
  }
}

export function isValidStructuralGoatId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export async function getGoatOwnershipHistory(
  goatId: number,
): Promise<OwnershipHistoryResponseDTO> {
  if (!isValidStructuralGoatId(goatId)) {
    throw new InvalidGoatIdError();
  }

  const { data } = await requestBackEnd.get<OwnershipHistoryResponseDTO>(
    `/goats/${goatId}/ownership-history`,
  );
  return data;
}
