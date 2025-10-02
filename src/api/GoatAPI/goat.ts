// src/api/GoatAPI/goat.ts
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { requestBackEnd } from "../../utils/request";
import type { BackendGoatPayload } from "../../Convertes/goats/goatConverter";
import { toGoatResponseDTO } from "../../Convertes/goats/goatConverter";

// Helper to unwrap optional nested data envelope
type Envelope<T> = { data: T } | T;
function hasData<T>(x: unknown): x is { data: T } {
  return typeof x === "object" && x !== null && Object.prototype.hasOwnProperty.call(x, "data");
}
const unwrap = <T>(d: Envelope<T>): T => (hasData<T>(d) ? d.data : (d as T));

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
  const content = Array.isArray(data)
    ? data
    : (data?.content ?? data?.data?.content ?? []);
  if (import.meta.env.DEV) {
    console.debug("🐐 [API] getAllGoats raw sample:", Array.isArray(data) ? data?.[0] : data?.content?.[0] ?? data?.data?.content?.[0]);
  }
  return content.map(toGoatResponseDTO);
}

/** Busca cabras por nome; pode filtrar por fazenda via farmId. */
export async function searchGoatsByNameAndFarmId(
  farmId: number | undefined,
  name: string
): Promise<GoatResponseDTO[]> {
  const params: Record<string, string | number> = { name };
  if (typeof farmId !== "undefined") params.farmId = farmId;

  const { data } = await requestBackEnd.get("/goatfarms/goats/name", { params });
  const content = Array.isArray(data)
    ? data
    : (data?.content ?? data?.data?.content ?? []);
  if (import.meta.env.DEV) {
    console.debug("🐐 [API] searchGoats raw sample:", Array.isArray(data) ? data?.[0] : data?.content?.[0] ?? data?.data?.content?.[0]);
  }
  return content.map(toGoatResponseDTO);
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
  const raw = data?.data ?? data;
  if (import.meta.env.DEV) {
    console.debug("🐐 [API] paginated raw sample:", raw?.content?.[0]);
  }
  return {
    ...raw,
    content: (raw?.content ?? []).map(toGoatResponseDTO),
  };
}

/** Busca única por número de registro. */
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.get(`/goatfarms/goats/registration/${registrationNumber}`);
  const body = unwrap(data);
  if (import.meta.env.DEV) {
    console.debug("🐐 [API] fetch by registration raw:", body);
  }
  return toGoatResponseDTO(body);
}

/** Criação de nova cabra. */
export const createGoat = async (goatData: BackendGoatPayload): Promise<GoatResponseDTO> => {
  const response = await requestBackEnd.post("/goatfarms/goats", goatData);
  const body = unwrap(response.data);
  return toGoatResponseDTO(body);
};

/** Atualização de cabra existente. */
export async function updateGoat(
  registrationNumber: string,
  goatData: BackendGoatPayload
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.put(`/goatfarms/goats/${registrationNumber}`, goatData);
  const body = unwrap(data);
  return toGoatResponseDTO(body);
}

/** Busca por nome dentro de uma fazenda (normalizado) */
export async function findGoatsByFarmAndName(
  farmId: number,
  term: string
): Promise<GoatResponseDTO[]> {
  const isNumber = /^\d+$/.test(term);
  const params = isNumber ? { registrationNumber: term } : { name: term };
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}/goats`, { params });
  const content = Array.isArray(data)
    ? data
    : (data?.content ?? data?.data?.content ?? []);
  if (import.meta.env.DEV) {
    console.debug("🐐 [API] search-by-term raw sample:", Array.isArray(data) ? data?.[0] : data?.content?.[0] ?? data?.data?.content?.[0]);
  }
  return content.map(toGoatResponseDTO);
}
