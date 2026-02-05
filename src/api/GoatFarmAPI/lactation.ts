import { requestBackEnd } from "../../utils/request";
import type { 
  LactationRequestDTO, 
  LactationDryRequestDTO, 
  LactationResponseDTO,
  LactationSummaryDTO
} from "../../Models/LactationDTOs";

// Base URL helper
const getBaseUrl = (farmId: number, goatId: string) => 
  `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/lactations`;

// Iniciar nova lactação
export async function startLactation(
  farmId: number, 
  goatId: string, 
  data: LactationRequestDTO
): Promise<LactationResponseDTO> {
  const { data: response } = await requestBackEnd.post(getBaseUrl(farmId, goatId), data);
  return response;
}

// Secar lactação (fechar)
export async function dryLactation(
  farmId: number, 
  goatId: string, 
  lactationId: number, 
  data: LactationDryRequestDTO
): Promise<void> {
  await requestBackEnd.patch(
    `${getBaseUrl(farmId, goatId)}/${lactationId}/dry`, 
    data
  );
}

// Obter lactação ativa
export async function getActiveLactation(
  farmId: number, 
  goatId: string
): Promise<LactationResponseDTO | null> {
  try {
    const { data } = await requestBackEnd.get(`${getBaseUrl(farmId, goatId)}/active`);
    return data;
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

// Buscar lactação por ID
export async function getLactationById(
  farmId: number,
  goatId: string,
  lactationId: number
): Promise<LactationResponseDTO> {
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/${lactationId}`
  );
  return data;
}

// Listar histórico de lactações
export async function getLactationHistory(
  farmId: number, 
  goatId: string,
  page: number = 0,
  size: number = 10
): Promise<{ content: LactationResponseDTO[], totalPages: number }> {
  const { data } = await requestBackEnd.get(getBaseUrl(farmId, goatId), {
    params: { page, size }
  });
  return data;
}

// Resumo de lactação
export async function getLactationSummary(
  farmId: number,
  goatId: string,
  lactationId: number
): Promise<LactationSummaryDTO> {
  const { data } = await requestBackEnd.get(
    `${getBaseUrl(farmId, goatId)}/${lactationId}/summary`
  );
  return data;
}
