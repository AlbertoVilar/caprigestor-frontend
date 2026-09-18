import { requestBackEnd } from "../../utils/request";
import { isValidGoatTechnicalToken } from "../../utils/appRoutes";
import type {
  FarmGoatHistoricalMilkLactationResponseDTO,
  FarmGoatRegistryHistoricalDossierBasicDTO,
  FarmGoatRegistryHistoricalGenealogyDTO,
} from "../../Models/FarmGoatHistoricalDossierDTOs";

export class InvalidFarmIdError extends Error {
  constructor() {
    super("A farmId must be a positive safe integer.");
    this.name = "InvalidFarmIdError";
  }
}

export class InvalidGoatTokenError extends Error {
  constructor() {
    super("A valid goat technical token (e.g. 'technical-42') is required.");
    this.name = "InvalidGoatTokenError";
  }
}

export function isValidStructuralFarmId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function isValidGoatToken(token: unknown): token is string {
  return isValidGoatTechnicalToken(token);
}

export async function getFarmGoatRegistryHistoricalDossierBasic(
  farmId: number,
  goatIdToken: string
): Promise<FarmGoatRegistryHistoricalDossierBasicDTO> {
  if (!isValidStructuralFarmId(farmId)) {
    throw new InvalidFarmIdError();
  }
  if (!isValidGoatToken(goatIdToken)) {
    throw new InvalidGoatTokenError();
  }

  const { data } = await requestBackEnd.get<FarmGoatRegistryHistoricalDossierBasicDTO>(
    `/goatfarms/${farmId}/goat-registry/${encodeURIComponent(goatIdToken)}`
  );
  return data;
}

export async function getFarmGoatRegistryHistoricalGenealogy(
  farmId: number,
  goatIdToken: string,
  complementaryAbcc = false
): Promise<FarmGoatRegistryHistoricalGenealogyDTO> {
  if (!isValidStructuralFarmId(farmId)) {
    throw new InvalidFarmIdError();
  }
  if (!isValidGoatToken(goatIdToken)) {
    throw new InvalidGoatTokenError();
  }

  const params = complementaryAbcc ? { complementaryAbcc: true } : {};

  const { data } = await requestBackEnd.get<FarmGoatRegistryHistoricalGenealogyDTO>(
    `/goatfarms/${farmId}/goat-registry/${encodeURIComponent(goatIdToken)}/genealogy`,
    { params }
  );
  return data;
}

export async function getFarmGoatRegistryHistoricalMilkLactation(
  farmId: number,
  goatIdToken: string
): Promise<FarmGoatHistoricalMilkLactationResponseDTO> {
  if (!isValidStructuralFarmId(farmId)) {
    throw new InvalidFarmIdError();
  }
  if (!isValidGoatToken(goatIdToken)) {
    throw new InvalidGoatTokenError();
  }

  const { data } = await requestBackEnd.get<FarmGoatHistoricalMilkLactationResponseDTO>(
    `/goatfarms/${farmId}/goat-registry/${encodeURIComponent(goatIdToken)}/milk-lactation`
  );
  return data;
}
