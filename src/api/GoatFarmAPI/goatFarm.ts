import { BASE_URL } from "../../utils/apiConfig";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatFarmRequest } from "@/Models/GoatFarmRequestDTO";
import type { GoatResponseDTO } from "@/Models/goatResponseDTO";
import type { GoatPageResponseDTO } from "@/Models/GoatPaginatedResponseDTO";
import { GoatFarmResponse } from "@/Models/GoatFarmResponseDTO";

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

// 🔹 Busca cabras com filtros opcionais (fazenda, nome, registro)
export async function searchGoatsByFilters(
  farmId?: number,
  name?: string,
  registrationNumber?: string
): Promise<GoatResponseDTO[]> {
  const queryParams = new URLSearchParams();

  if (farmId !== undefined) queryParams.append("farmId", String(farmId));
  if (name) queryParams.append("name", name);
  if (registrationNumber) queryParams.append("registrationNumber", registrationNumber);

  const res = await fetch(`${BASE_URL}/goatfarms/goats/search?${queryParams}`);
  if (!res.ok) throw new Error("Erro ao buscar cabras por filtros");
  return await res.json();
}

// 🔹 Busca uma fazenda pelo ID
export async function getGoatFarmById(farmId: number): Promise<GoatFarmResponse> {
  const res = await fetch(`${BASE_URL}/goatfarms/${farmId}`);
  if (!res.ok) throw new Error("Erro ao buscar capril por ID");
  return await res.json();
}
