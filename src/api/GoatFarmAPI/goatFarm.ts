import type { GoatDTO } from "../../Models/goatDTO";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { BASE_URL } from "../../utils/apiConfig";

export async function getAllFarms(): Promise<GoatFarmDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms`);
  if (!res.ok) throw new Error("Erro ao buscar fazendas");
  const data = await res.json();
  return data.content;
}

export async function getGoatsByFarmId(farmId: number): Promise<GoatDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms/${farmId}/goats`);
  if (!res.ok) throw new Error("Erro ao buscar cabras da fazenda");
  const data = await res.json();
  return data.content;
}

export async function fetchFarmByName(name: string): Promise<GoatFarmDTO> {
  const res = await fetch(`${BASE_URL}/goatfarms/name?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Fazenda não encontrada");
  return await res.json();
}
