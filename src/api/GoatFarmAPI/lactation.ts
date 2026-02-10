import { requestBackEnd } from "../../utils/request";
import type { 
  LactationRequestDTO, 
  LactationDryRequestDTO, 
  LactationResponseDTO,
  LactationSummaryDTO,
  LactationDryOffAlertResponseDTO
} from "../../Models/LactationDTOs";
import { AlertsEventBus } from "../../services/alerts/AlertsEventBus";

type Envelope<T> = { data: T } | T;
const unwrap = <T>(data: Envelope<T>): T =>
  (data as { data?: T }).data ?? (data as T);

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
  AlertsEventBus.emit(farmId);
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
  AlertsEventBus.emit(farmId);
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

export async function getFarmDryOffAlerts(
  farmId: number,
  params: { referenceDate?: string; page?: number; size?: number } = {}
): Promise<LactationDryOffAlertResponseDTO> {
  const { data } = await requestBackEnd.get(
    `/goatfarms/${farmId}/milk/alerts/dry-off`,
    { params }
  );

  return unwrap(data);
}
