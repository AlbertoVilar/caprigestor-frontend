import type { GoatDTO } from "../../Models/goatDTO";
import type { GoatRequestDTO } from "@/Models/goatRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";

// Busca todas as cabras cadastradas no sistema (com paginação)
export async function getAllGoats(): Promise<GoatDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms/goats`);
  if (!res.ok) throw new Error("Erro ao buscar cabras");
  const data = await res.json();
  return data.content; // 👈 Certo, se o backend retorna um objeto paginado
}

export async function searchGoatsByNameAndFarmId(farmId: number, name: string): Promise<GoatDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms/${farmId}/goats/name?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Erro ao buscar cabras pelo nome e fazenda");
  const data = await res.json();
  return data.content;
}

// ✅ Cria uma nova cabra
export async function createGoat(goatData: GoatRequestDTO): Promise<GoatDTO> {
  const response = await fetch(`${BASE_URL}/goatfarms/goats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goatData),
  });

  if (!response.ok) {
    throw new Error("Erro ao cadastrar cabra");
  }

  return await response.json();
}



