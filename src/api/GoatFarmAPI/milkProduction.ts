import { requestBackEnd } from "../../utils/request";
import type {
  MilkProductionRequestDTO,
  MilkProductionResponseDTO,
  MilkProductionUpdateRequestDTO,
} from "../../Models/MilkProductionDTOs";
import type { PaginatedResponse } from "../../types/api";

const getBaseUrl = (farmId: number, goatId: string) =>
  `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/milk-productions`;

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
  const params = new URLSearchParams();

  if (typeof query.page === "number") params.append("page", String(query.page));
  if (typeof query.size === "number") params.append("size", String(query.size));

  if (Array.isArray(query.sort)) {
    query.sort.forEach((sortValue) => params.append("sort", sortValue));
  } else if (query.sort) {
    params.append("sort", query.sort);
  }

  // Backend contract expects 'from'/'to' query params.
  if (query.dateFrom) params.append("from", query.dateFrom);
  if (query.dateTo) params.append("to", query.dateTo);
  if (query.includeCanceled) params.append("includeCanceled", "true");

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
