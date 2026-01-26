import { requestBackEnd } from "../../utils/request";
import type { PaginatedResponse } from "../../types/api";
import type {
  BreedingRequestDTO,
  PregnancyConfirmRequestDTO,
  PregnancyCloseRequestDTO,
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
} from "../../Models/ReproductionDTOs";

const getBaseUrl = (farmId: number, goatId: string) =>
  `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/reproduction`;

export async function registerBreeding(
  farmId: number,
  goatId: string,
  data: BreedingRequestDTO
): Promise<ReproductiveEventResponseDTO> {
  const { data: response } = await requestBackEnd.post(
    `${getBaseUrl(farmId, goatId)}/breeding`,
    data
  );
  return response;
}

export async function confirmPregnancy(
  farmId: number,
  goatId: string,
  data: PregnancyConfirmRequestDTO
): Promise<PregnancyResponseDTO> {
  const { data: response } = await requestBackEnd.patch(
    `${getBaseUrl(farmId, goatId)}/pregnancies/confirm`,
    data
  );
  return response;
}

export async function getActivePregnancy(
  farmId: number,
  goatId: string
): Promise<PregnancyResponseDTO | null> {
  try {
    const { data } = await requestBackEnd.get(
      `${getBaseUrl(farmId, goatId)}/pregnancies/active`
    );
    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getPregnancyById(
  farmId: number,
  goatId: string,
  pregnancyId: number
): Promise<PregnancyResponseDTO> {
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/pregnancies/${pregnancyId}`
  );
  return data;
}

export async function closePregnancy(
  farmId: number,
  goatId: string,
  pregnancyId: number,
  data: PregnancyCloseRequestDTO
): Promise<PregnancyResponseDTO> {
  const { data: response } = await requestBackEnd.patch(
    `${getBaseUrl(farmId, goatId)}/pregnancies/${pregnancyId}/close`,
    data
  );
  return response;
}

export async function getPregnancies(
  farmId: number,
  goatId: string,
  page = 0,
  size = 10
): Promise<PaginatedResponse<PregnancyResponseDTO>> {
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/pregnancies`,
    { params: { page, size } }
  );
  return data;
}

export async function getReproductiveEvents(
  farmId: number,
  goatId: string,
  page = 0,
  size = 10
): Promise<PaginatedResponse<ReproductiveEventResponseDTO>> {
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/events`,
    { params: { page, size } }
  );
  return data;
}
