import { requestBackEnd } from "../../utils/request";
import type { 
  LactationRequestDTO, 
  LactationDryRequestDTO, 
  LactationResponseDTO 
} from "../../Models/LactationDTOs";

// Base URL helper
const getBaseUrl = (farmId: number, goatId: number) => 
  `/goatfarms/${farmId}/goats/${goatId}/lactations`;

// Iniciar nova lactação
export async function startLactation(
  farmId: number, 
  goatId: number, 
  data: LactationRequestDTO
): Promise<LactationResponseDTO> {
  const { data: response } = await requestBackEnd.post(getBaseUrl(farmId, goatId), data);
  return response;
}

// Secar lactação (fechar)
export async function dryLactation(
  farmId: number, 
  goatId: number, 
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
  goatId: number
): Promise<LactationResponseDTO | null> {
  try {
    const { data } = await requestBackEnd.get(`${getBaseUrl(farmId, goatId)}/active`);
    return data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

// Listar histórico de lactações
export async function getLactationHistory(
  farmId: number, 
  goatId: number,
  page: number = 0,
  size: number = 10
): Promise<{ content: LactationResponseDTO[], totalPages: number }> {
  const { data } = await requestBackEnd.get(getBaseUrl(farmId, goatId), {
    params: { page, size }
  });
  return data;
}
