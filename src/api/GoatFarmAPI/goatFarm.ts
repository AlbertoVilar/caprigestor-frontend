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
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}`);
  return data;
}

// 🔹 Busca todas as fazendas cadastradas no sistema (sem paginação)
export async function getAllFarms(): Promise<GoatFarmDTO[]> {
  console.log('Fazendo requisição para /goatfarms');
  const response = await requestBackEnd.get('/goatfarms');
  console.log('Resposta recebida:', response);
  console.log('Data:', response.data);
  return response.data.content || response.data;
}

// 🔹 Busca todas as fazendas paginadas
export async function getAllFarmsPaginated(
  page: number = 0,
  size: number = 12
): Promise<{
  content: GoatFarmDTO[];
  page: { size: number; number: number; totalPages: number; totalElements: number };
}> {
  const { data } = await requestBackEnd.get('/goatfarms', { params: { page, size } });
  return data;
}

// 🔹 Busca todas as cabras paginadas (sem filtro por fazenda)
export async function getAllGoatsPaginated(
  page: number = 0,
  size: number = 12
): Promise<GoatPageResponseDTO> {
  const { data } = await requestBackEnd.get('/goatfarms/goats', { params: { page, size } });
  return data;
}

// 🔹 Busca cabra pelo número de registro
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO | null> {
  try {
    const { data } = await requestBackEnd.get(`/goatfarms/goats/registration/${encodeURIComponent(registrationNumber)}`);
    return data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw new Error("Erro ao buscar cabra por número de registro");
  }
}

// 🔹 Busca uma fazenda pelo nome
export async function fetchFarmByName(name: string): Promise<GoatFarmDTO> {
  const { data } = await requestBackEnd.get('/goatfarms/name', { params: { name } });
  return data;
}

// 🔹 Cria uma nova fazenda com dados aninhados (owner, address, phones, farm)
export async function createFarm(data: FarmCreateRequest): Promise<GoatFarmResponse> {
  const { data: response } = await requestBackEnd.post('/goatfarms/full', data);
  return response;
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
  console.log("Enviando PUT para /goatfarms/" + farmId, data);
  await requestBackEnd.put(`/goatfarms/${farmId}`, data);
}

