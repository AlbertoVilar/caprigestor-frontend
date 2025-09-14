import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { requestBackEnd } from "../../utils/request";
import { mapGoatToBackend } from "../../Convertes/goats/goatConverter";

/**
 * 🚨 Observações importantes
 * - Backend correto para criação/edição de caprinos: `POST/PUT /goatfarms/goats`
 * - Busca por registro: `GET /goatfarms/goats/registration/{registrationNumber}`
 * - Listagem por fazenda (paginada): `GET /goatfarms/{farmId}/goats`
 * - Busca por nome (opcionalmente com filtro de fazenda): `GET /goatfarms/goats/name?name=...&farmId=...`
 */

/** 🔎 Lista todas as cabras (paginado). Uso administrativo/diagnóstico. */
export async function getAllGoats(page = 0, size = 100): Promise<GoatResponseDTO[]> {
  const { data } = await requestBackEnd.get("/goatfarms/goats", { params: { page, size } });
  // O backend geralmente retorna Page<T>; pegue data.content se existir
  return Array.isArray(data) ? data : (data?.content ?? []);
}

/** 🔎 Busca cabras por nome; pode filtrar por fazenda via farmId (se suportado no BE). */
export async function searchGoatsByNameAndFarmId(
  farmId: number | undefined,
  name: string
): Promise<GoatResponseDTO[]> {
  const params: Record<string, string | number> = { name };
  if (typeof farmId !== "undefined") params.farmId = farmId;

  const { data } = await requestBackEnd.get("/goatfarms/goats/name", { params });
  return Array.isArray(data) ? data : (data?.content ?? []);
}

/** ✅ Lista cabras por ID da fazenda, com paginação (endpoint do BE). */
export async function findGoatsByFarmIdPaginated(
  farmId: number,
  page: number,
  size: number
): Promise<{
  content: GoatResponseDTO[];
  page: { number: number; totalPages: number };
}> {
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}/goats`, {
    params: { page, size },
  });
  return data;
}

/** ✅ Busca única por número de registro (endpoint do BE). */
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.get(`/goatfarms/goats/registration/${registrationNumber}`);
  return data;
}

/** ✅ Criação de nova cabra (payload mapeado para o formato do backend). */
export const createGoat = async (goatData: GoatRequestDTO): Promise<GoatResponseDTO> => {
  const payload = mapGoatToBackend(goatData);
  const response = await requestBackEnd.post("/goatfarms/goats", payload);
  return response.data;
};

/** ✅ Atualização de cabra existente (PUT /goatfarms/goats/{registrationNumber}). */
export async function updateGoat(
  registrationNumber: string,
  goatData: GoatRequestDTO
): Promise<GoatResponseDTO> {
  const payload = mapGoatToBackend(goatData);
  const { data } = await requestBackEnd.put(`/goatfarms/goats/${registrationNumber}`, payload);
  return data;
}
