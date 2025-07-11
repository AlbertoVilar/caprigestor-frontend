import type { GoatDTO } from "../../Models/goatResponseDTO";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { BASE_URL } from "../../utils/apiConfig";

// Busca todas as fazendas cadastradas no sistema (com paginação)
export async function getAllFarms(): Promise<GoatFarmDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms`);
  if (!res.ok) throw new Error("Erro ao buscar fazendas");
  const data = await res.json();
  return data.content;
}

// Busca todas as cabras de uma fazenda específica pelo ID
export async function getGoatsByFarmId(farmId: number): Promise<GoatDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms/${farmId}/goats`);
  if (!res.ok) throw new Error("Erro ao buscar cabras da fazenda");
  const data = await res.json();
  return data.content;
}

// Busca uma fazenda pelo nome (ignora maiúsculas/minúsculas)
export async function fetchFarmByName(name: string): Promise<GoatFarmDTO> {
  const res = await fetch(`${BASE_URL}/goatfarms/name?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Fazenda não encontrada");
  return await res.json();
}
