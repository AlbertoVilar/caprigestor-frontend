import { requestBackEnd } from "../../utils/request";
import type {
  BreedingRequestDTO,
  DiagnosisRecommendationResponseDTO,
  Page,
  PregnancyCheckRequestDTO,
  PregnancyConfirmRequestDTO,
  PregnancyCloseRequestDTO,
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
} from "../../Models/ReproductionDTOs";

type Envelope<T> = { data: T } | T;
const unwrap = <T>(data: Envelope<T>): T =>
  (data as { data?: T }).data ?? (data as T);

const getBaseUrl = (farmId: number, goatId: string) =>
  `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/reproduction`;

export async function createBreeding(
  farmId: number,
  goatId: string,
  data: BreedingRequestDTO
): Promise<ReproductiveEventResponseDTO> {
  const { data: response } = await requestBackEnd.post(
    `${getBaseUrl(farmId, goatId)}/breeding`,
    data
  );
  return unwrap(response);
}

export async function confirmPregnancyPositive(
  farmId: number,
  goatId: string,
  data: PregnancyConfirmRequestDTO
): Promise<PregnancyResponseDTO> {
  const { data: response } = await requestBackEnd.patch(
    `${getBaseUrl(farmId, goatId)}/pregnancies/confirm`,
    data
  );
  return unwrap(response);
}

export async function registerNegativeCheck(
  farmId: number,
  goatId: string,
  data: PregnancyCheckRequestDTO
): Promise<ReproductiveEventResponseDTO> {
  const { data: response } = await requestBackEnd.post(
    `${getBaseUrl(farmId, goatId)}/pregnancies/checks`,
    data
  );
  return unwrap(response);
}

export async function getActivePregnancy(
  farmId: number,
  goatId: string
): Promise<PregnancyResponseDTO | null> {
  try {
    const { data } = await requestBackEnd.get(
      `${getBaseUrl(farmId, goatId)}/pregnancies/active`
    );
    return unwrap(data);
  } catch (error: unknown) {
    const status = typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;
    if (status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getDiagnosisRecommendation(
  farmId: number,
  goatId: string,
  referenceDate?: string
): Promise<DiagnosisRecommendationResponseDTO> {
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/pregnancies/diagnosis-recommendation`,
    {
      params: referenceDate ? { referenceDate } : undefined,
    }
  );
  return unwrap(data);
}

export async function getPregnancyById(
  farmId: number,
  goatId: string,
  pregnancyId: number
): Promise<PregnancyResponseDTO> {
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/pregnancies/${pregnancyId}`
  );
  return unwrap(data);
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
  return unwrap(response);
}

export async function listPregnancies(
  farmId: number,
  goatId: string,
  paginationParams: { page?: number; size?: number } = {}
): Promise<Page<PregnancyResponseDTO>> {
  const { page = 0, size = 10 } = paginationParams;
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/pregnancies`,
    { params: { page, size } }
  );
  return unwrap(data);
}

export async function listReproductiveEvents(
  farmId: number,
  goatId: string,
  paginationParams: { page?: number; size?: number } = {}
): Promise<Page<ReproductiveEventResponseDTO>> {
  const { page = 0, size = 10 } = paginationParams;
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/events`,
    { params: { page, size } }
  );
  return unwrap(data);
}
