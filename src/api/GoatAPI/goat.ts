// src/api/GoatAPI/goat.ts
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { requestBackEnd } from "../../utils/request";
import { mapGoatToBackend } from "../../Convertes/goats/goatConverter";

/**
 * 🔎 Endpoints disponíveis no backend:
 * - POST   /goatfarms/goats
 * - PUT    /goatfarms/goats/{registrationNumber}
 * - GET    /goatfarms/goats/registration/{registrationNumber}
 * - GET    /goatfarms/{farmId}/goats
 * - GET    /goatfarms/goats/name?name=...&farmId=...
 */

/** Lista todas as cabras (paginado). Uso administrativo/diagnóstico. */
export async function getAllGoats(page = 0, size = 100): Promise<GoatResponseDTO[]> {
  const { data } = await requestBackEnd.get("/goatfarms/goats", { params: { page, size } });
  return Array.isArray(data) ? data : (data?.content ?? []);
}

/** Busca cabras por nome; pode filtrar por fazenda via farmId. */
export async function searchGoatsByNameAndFarmId(
  farmId: number | undefined,
  name: string
): Promise<GoatResponseDTO[]> {
  const params: Record<string, string | number> = { name };
  if (typeof farmId !== "undefined") params.farmId = farmId;

  const { data } = await requestBackEnd.get("/goatfarms/goats/name", { params });
  return Array.isArray(data) ? data : (data?.content ?? []);
}

/** Lista cabras por ID da fazenda, com paginação. */
export async function findGoatsByFarmIdPaginated(
  farmId: number,
  page: number,
  size: number
): Promise<{
  content: GoatResponseDTO[];
  number: number;
  totalPages: number;
  totalElements: number;
  size: number;
  first: boolean;
  last: boolean;
}> {
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}/goats`, {
    params: { page, size },
  });
  return data;
}

/** Busca única por número de registro. */
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.get(`/goatfarms/goats/registration/${registrationNumber}`);
  return data;
}

/** Criação de nova cabra. */
export const createGoat = async (goatData: GoatRequestDTO): Promise<GoatResponseDTO> => {
  const payload = mapGoatToBackend(goatData);
  const response = await requestBackEnd.post("/goatfarms/goats", payload);
  return response.data;
};

/** Atualização de cabra existente. */
export async function updateGoat(
  registrationNumber: string,
  goatData: GoatRequestDTO
): Promise<GoatResponseDTO> {
  const payload = mapGoatToBackend(goatData);
  const { data } = await requestBackEnd.put(`/goatfarms/goats/${registrationNumber}`, payload);
  return data;
}
