import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";
import { requestBackEnd } from "../../utils/request";

// 🔍 Busca todas as cabras cadastradas (sem paginação) – OBSOLETO ou para fins administrativos
export async function getAllGoats(): Promise<GoatResponseDTO[]> {
  try {
    const response = await requestBackEnd.get("/goats");
    return response.data.content;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar cabras";
    throw new Error(errorMessage);
  }
}

// 🔍 Busca cabras por nome dentro de uma fazenda
export async function searchGoatsByNameAndFarmId(
  farmId: number,
  name: string
): Promise<GoatResponseDTO[]> {
  try {
    const response = await requestBackEnd.get(
      `/goatfarms/${farmId}/goats/name?name=${encodeURIComponent(name)}`
    );
    return response.data.content;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar cabras pelo nome e fazenda";
    throw new Error(errorMessage);
  }
}

// ✅ Busca todas as cabras de uma fazenda (sem paginação) - PÚBLICO
export async function findGoatsByFarmId(farmId: number): Promise<GoatResponseDTO[]> {
  try {
    const response = await requestBackEnd.get(`/goatfarms/${farmId}/goats`);
    return response.data.content;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar cabras da fazenda";
    throw new Error(errorMessage);
  }
}

// ✅ Busca cabras por ID da fazenda com paginação
export async function findGoatsByFarmIdPaginated(
  farmId: number,
  page: number,
  size: number
): Promise<{
  content: GoatResponseDTO[];
  page: { number: number; totalPages: number };
}> {
  try {
    const response = await requestBackEnd.get(
      `/goatfarms/${farmId}/goats?page=${page}&size=${size}`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar cabras da fazenda com paginação";
    throw new Error(errorMessage);
  }
}

// ✅ Busca única por número de registro da cabra (sem vínculo com fazenda)
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO> {
  try {
    const response = await requestBackEnd.get(`/goats/${registrationNumber}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar cabra por número de registro";
    throw new Error(errorMessage);
  }
}

// ✅ Criação de nova cabra
export async function createGoat(
  goatData: GoatRequestDTO
): Promise<GoatResponseDTO> {
  try {
    const response = await requestBackEnd.post("/goatfarms/goats", goatData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao cadastrar cabra";
    throw new Error(errorMessage);
  }
}

// ✅ Atualização de cabra existente
export async function updateGoat(
  registrationNumber: string,
  goat: GoatRequestDTO
): Promise<void> {
  try {
    await requestBackEnd.put(`/goatfarms/goats/${registrationNumber}`, goat);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao atualizar cabra";
    throw new Error(errorMessage);
  }
}
