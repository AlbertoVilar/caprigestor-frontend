import { BASE_URL } from "../../utils/apiConfig";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatFarmRequest } from "@/Models/GoatFarmRequestDTO";
import type { GoatResponseDTO } from "@/Models/goatResponseDTO";
import type { GoatPageResponseDTO } from "@/Models/GoatPaginatedResponseDTO";
import { GoatFarmResponse } from "@/Models/GoatFarmResponseDTO";
import { OwnerRequest } from "@/Models/OwnerRequestDTO";
import { AddressRequest } from "@/Models/AddressRequestDTO";
import { PhonesRequestDTO } from "@/Models/PhoneRequestDTO";

// 🔹 Busca uma fazenda pelo ID
export async function getGoatFarmById(farmId: number): Promise<GoatFarmResponse> {
  const res = await fetch(`${BASE_URL}/goatfarms/${farmId}`);
  if (!res.ok) throw new Error("Erro ao buscar capril por ID");
  return await res.json();
}


// 🔹 Busca todas as fazendas cadastradas no sistema (sem paginação)
export async function getAllFarms(): Promise<GoatFarmDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms`);
  if (!res.ok) throw new Error("Erro ao buscar fazendas");
  const data = await res.json();
  return data.content;
}

// 🔹 Busca todas as fazendas paginadas
export async function getAllFarmsPaginated(
  page: number = 0,
  size: number = 12
): Promise<{
  content: GoatFarmDTO[];
  page: { size: number; number: number; totalPages: number; totalElements: number };
}> {
  const res = await fetch(`${BASE_URL}/goatfarms?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Erro ao buscar fazendas paginadas");
  return await res.json();
}

// 🔹 Busca todas as cabras paginadas (sem filtro por fazenda)
export async function getAllGoatsPaginated(
  page: number = 0,
  size: number = 12
): Promise<GoatPageResponseDTO> {
  const url = `${BASE_URL}/goatfarms/goats?page=${page}&size=${size}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar cabras");
  return await res.json();
}

// 🔹 Busca cabra pelo número de registro
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO | null> {
  const res = await fetch(`${BASE_URL}/goatfarms/goats/registration/${registrationNumber}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Erro ao buscar cabra por número de registro");
  }
  return await res.json();
}

// 🔹 Busca uma fazenda pelo nome
export async function fetchFarmByName(name: string): Promise<GoatFarmDTO> {
  const res = await fetch(`${BASE_URL}/goatfarms/name?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Fazenda não encontrada");
  return await res.json();
}

// 🔹 Cria uma nova fazenda
export async function createFarm(data: GoatFarmRequest): Promise<GoatFarmResponse> {
  const res = await fetch(`${BASE_URL}/goatfarms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Erro ao criar fazenda");
  return await res.json();
}

// Tipo do corpo esperado pelo backend
export interface FullGoatFarmUpdateRequest {
  owner: OwnerRequest;
  address: AddressRequest;
  phones: PhonesRequestDTO[];
  farm: GoatFarmRequest;
}

// ✅ Função para atualizar toda a fazenda (proprietário, endereço, telefones e dados da fazenda)
export async function updateGoatFarmFull(
  farmId: number,
  data: FullGoatFarmUpdateRequest
): Promise<void> {
  console.log("Enviando PUT para /goatfarms/" + farmId, data);

  const res = await fetch(`${BASE_URL}/goatfarms/${farmId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data), // Corpo aninhado com owner, address, phones e farm
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Erro desconhecido" }));
    const errorMessage = errorData.message || `Erro ao atualizar fazenda: Status ${res.status}`;
    throw new Error(errorMessage);
  }

  // Se o backend retornar algo no corpo da resposta, você pode ajustar aqui:
  // return await res.json();
}
