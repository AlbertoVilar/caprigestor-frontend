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

export async function updateMilkProduction(
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

export interface MilkProductionQuery {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export async function getMilkProductions(
  farmId: number,
  goatId: string,
  query: MilkProductionQuery = {}
): Promise<PaginatedResponse<MilkProductionResponseDTO>> {
  const { data } = await requestBackEnd.get(getBaseUrl(farmId, goatId), {
    params: query,
  });
  return data;
}

export async function deleteMilkProduction(
  farmId: number,
  goatId: string,
  id: number
): Promise<void> {
  await requestBackEnd.delete(`${getBaseUrl(farmId, goatId)}/${id}`);
}
