import { BASE_URL } from "../../utils/apiConfig";
import { requestBackEnd } from "../../utils/request";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatFarmRequest } from "@/Models/GoatFarmRequestDTO";
import type { GoatResponseDTO } from "@/Models/goatResponseDTO";
import type { GoatPageResponseDTO } from "@/Models/GoatPaginatedResponseDTO";
import { GoatFarmResponse } from "@/Models/GoatFarmResponseDTO";
import { OwnerRequest } from "@/Models/OwnerRequestDTO";
import { AddressRequest } from "@/Models/AddressRequestDTO";
import { PhonesRequestDTO } from "@/Models/PhoneRequestDTO";
import { FarmCreateRequest } from "@/Models/FarmCreateRequestDTO";

// 🔹 Busca uma fazenda pelo ID
export async function getGoatFarmById(farmId: number): Promise<GoatFarmResponse> {
  try {
    const response = await requestBackEnd.get(`/goatfarms/${farmId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar capril por ID";
    throw new Error(errorMessage);
  }
}

// 🔹 Busca todas as fazendas cadastradas no sistema (sem paginação)
export async function getAllFarms(): Promise<GoatFarmDTO[]> {
  try {
    const response = await requestBackEnd.get("/goatfarms");
    return response.data.content;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar fazendas";
    throw new Error(errorMessage);
  }
}

// 🔹 Busca todas as fazendas paginadas
export async function getAllFarmsPaginated(
  page: number = 0,
  size: number = 12
): Promise<{
  content: GoatFarmDTO[];
  page: { size: number; number: number; totalPages: number; totalElements: number };
}> {
  try {
    const response = await requestBackEnd.get(`/goatfarms?page=${page}&size=${size}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar fazendas paginadas";
    throw new Error(errorMessage);
  }
}

// 🔹 Busca cabras de um capril específico com paginação
export async function getAllGoatsPaginated(
  farmId: number,
  page: number = 0,
  size: number = 12
): Promise<GoatPageResponseDTO> {
  try {
    const response = await requestBackEnd.get(`/goatfarms/${farmId}/goats?page=${page}&size=${size}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar cabras";
    throw new Error(errorMessage);
  }
}

// 🔹 Busca cabra pelo número de registro
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO | null> {
  try {
    const response = await requestBackEnd.get(`/goatfarms/goats/registration/${registrationNumber}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar cabra por número de registro";
    throw new Error(errorMessage);
  }
}

// 🔹 Busca uma fazenda pelo nome
export async function fetchFarmByName(name: string): Promise<GoatFarmDTO> {
  try {
    const response = await requestBackEnd.get(`/goatfarms/name?name=${encodeURIComponent(name)}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Fazenda não encontrada";
    throw new Error(errorMessage);
  }
}

// 🔹 Cria uma nova fazenda com dados aninhados (owner, address, phones, farm)
export async function createFarm(data: FarmCreateRequest): Promise<GoatFarmResponse> {
  try {
    const response = await requestBackEnd.post("/goatfarms/full", data);
    return response.data;
  } catch (error: any) {
    // Captura mensagem específica do backend para conflitos
    if (error.response?.status === 409) {
      const backendMessage = error.response?.data?.message || "Dados já existem no sistema";
      throw new Error(`Conflito: ${backendMessage}`);
    }
    
    const errorMessage = error.response?.data?.message || error.message || "Erro ao criar fazenda";
    throw new Error(errorMessage);
  }
}

// 🔹 Atualiza uma fazenda com dados aninhados (PUT)
export interface FullGoatFarmUpdateRequest {
  owner: OwnerRequest;
  address: AddressRequest;
  phones: PhonesRequestDTO[];
  farm: GoatFarmRequest;
}

export async function updateGoatFarmFull(
  farmId: number,
  data: FullGoatFarmUpdateRequest
): Promise<void> {
  try {
    await requestBackEnd.put(`/goatfarms/${farmId}`, data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao atualizar fazenda";
    throw new Error(errorMessage);
  }
}
