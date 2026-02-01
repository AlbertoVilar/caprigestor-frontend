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

/** Busca cabra por ID dentro da fazenda (endpoint oficial RESTful). */
export async function fetchGoatById(
  farmId: number,
  goatId: string | number
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.get(
    `/goatfarms/${farmId}/goats/${goatId}`
  );
  const body = unwrap(data);
  if (import.meta.env.DEV) {
    console.debug("🐐 [API] fetch by ID raw:", body);
  }
  return toGoatResponseDTO(body);
}

/** 
 * Busca unica por registro dentro da fazenda.
 * @deprecated Use fetchGoatById se tiver o ID.
 */
export async function fetchGoatByFarmAndRegistration(
  farmId: number,
  registrationNumber: string
): Promise<GoatResponseDTO> {
  // Mantendo compatibilidade caso o backend aceite registro na mesma rota ou rota específica
  // Se o backend espera ID na rota /{goatId}, passar registro aqui pode falhar se não for ID.
  const { data } = await requestBackEnd.get(
    `/goatfarms/${farmId}/goats/${encodeURIComponent(registrationNumber)}`
  );
  const body = unwrap(data);
  if (import.meta.env.DEV) {
    console.debug("🐐 [API] fetch by farm+registration raw:", body);
  }
  return toGoatResponseDTO(body);
}


/** Criação de nova cabra (rota aninhada por fazenda). */
export const createGoat = async (
  farmId: number,
  goatData: BackendGoatPayload
): Promise<GoatResponseDTO> => {
  const response = await requestBackEnd.post(`/goatfarms/${farmId}/goats`, goatData);
  const body = unwrap(response.data);
  return toGoatResponseDTO(body);
};

/** Atualização de cabra existente (rota aninhada por fazenda). */
export async function updateGoat(
  farmId: number,
  registrationNumber: string,
  goatData: BackendGoatPayload
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.put(
    `/goatfarms/${farmId}/goats/${encodeURIComponent(registrationNumber)}`,
    goatData
  );
  const body = unwrap(data);
  return toGoatResponseDTO(body);
}

/** Busca por nome dentro de uma fazenda usando endpoint dedicado de search */
export async function findGoatsByFarmAndName(
  farmId: number,
  term: string
): Promise<GoatResponseDTO[]> {
  // Backend validado: /api/goatfarms/{id}/goats/search?name=...&page=0&size=12
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}/goats/search`, {
    params: { name: term, page: 0, size: 12 },
  });
  const raw = data?.data ?? data;
  const content = Array.isArray(raw)
    ? raw
    : (raw?.content ?? []);
  if (import.meta.env.DEV) {
    console.debug("🐐 [API] search-by-name raw sample:", Array.isArray(raw) ? raw?.[0] : raw?.content?.[0]);
  }
  return content.map(toGoatResponseDTO);
}
