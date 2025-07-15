
import { GoatPageResponseDTO } from "@/Models/GoatPaginatedResponseDTO";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { BASE_URL } from "../../utils/apiConfig";
import { GoatFarmRequest } from "@/Models/GoatFarmRequestDTO";
import { GoatResponseDTO } from "@/Models/goatResponseDTO";

// Busca todas as fazendas cadastradas no sistema (com paginação)
export async function getAllFarms(): Promise<GoatFarmDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms`);
  if (!res.ok) throw new Error("Erro ao buscar fazendas");
  const data = await res.json();
  return data.content;
}

// Busca todas as cabras paginadas (sem filtro por fazenda)
export async function getAllGoatsPaginated(
  page: number = 0,
  size: number = 12
): Promise<GoatPageResponseDTO> {
  const url = `${BASE_URL}/goatfarms/goats?page=${page}&size=${size}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar cabras");
  return await res.json();
}

// Busca cabra pelo número de registro (via /goatfarms/goats/registration/{registrationNumber})
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

// Busca uma fazenda pelo nome (ignora maiúsculas/minúsculas)
export async function fetchFarmByName(name: string): Promise<GoatFarmDTO> {
  const res = await fetch(`${BASE_URL}/goatfarms/name?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Fazenda não encontrada");
  return await res.json();
}

// Cria uma nova fazenda
export async function createFarm(data: GoatFarmRequest): Promise<void> {
  const res = await fetch(`${BASE_URL}/goatfarms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Erro ao cadastrar fazenda");
}

// Busca cabras por filtros opcionais: fazenda, nome ou registro
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