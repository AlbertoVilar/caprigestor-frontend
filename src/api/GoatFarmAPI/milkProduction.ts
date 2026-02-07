import { requestBackEnd } from "../../utils/request";
import type {
  MilkProductionRequestDTO,
  MilkProductionResponseDTO,
  MilkProductionUpdateRequestDTO,
} from "../../Models/MilkProductionDTOs";
import type { PaginatedResponse } from "../../types/api";

const ensureApiPrefix = (path: string) => {
  const baseUrl = `${requestBackEnd.defaults.baseURL ?? ""}`;
  return /\/api\/?$/i.test(baseUrl) ? path : `/api${path}`;
};

const getBaseUrl = (farmId: number, goatId: string) =>
  ensureApiPrefix(
    `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/milk-productions`
  );

export async function createMilkProduction(
  farmId: number,
  goatId: string,
  data: MilkProductionRequestDTO
): Promise<MilkProductionResponseDTO> {
  const { data: response } = await requestBackEnd.post(
    getBaseUrl(farmId, goatId),
    data
  );
  return response;
}

export async function patchMilkProduction(
  farmId: number,
  goatId: string,
  id: number,
  data: MilkProductionUpdateRequestDTO
): Promise<MilkProductionResponseDTO> {
  const { data: response } = await requestBackEnd.patch(
    `${getBaseUrl(farmId, goatId)}/${id}`,
    data
  );
  return response;
}

export async function getMilkProductionById(
  farmId: number,
  goatId: string,
  id: number
): Promise<MilkProductionResponseDTO> {
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/${id}`
  );
  return data;
}

export interface ListMilkProductionsQuery {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
  includeCanceled?: boolean;
}

export async function listMilkProductions(
  farmId: number,
  goatId: string,
  query: ListMilkProductionsQuery = {}
): Promise<PaginatedResponse<MilkProductionResponseDTO>> {
  const params: Record<string, string | number | boolean | string[]> = {};
  if (typeof query.page === "number") params.page = query.page;
  if (typeof query.size === "number") params.size = query.size;
  if (query.sort) params.sort = query.sort;
  if (query.dateFrom) params.dateFrom = query.dateFrom;
  if (query.dateTo) params.dateTo = query.dateTo;
  if (query.includeCanceled) params.includeCanceled = true;

  const { data } = await requestBackEnd.get(getBaseUrl(farmId, goatId), {
    params,
  });
  return data;
}

export async function cancelMilkProduction(
  farmId: number,
  goatId: string,
  id: number
): Promise<void> {
  await requestBackEnd.delete(`${getBaseUrl(farmId, goatId)}/${id}`);
}

export const updateMilkProduction = patchMilkProduction;
export const getMilkProductions = listMilkProductions;
export const deleteMilkProduction = cancelMilkProduction;
