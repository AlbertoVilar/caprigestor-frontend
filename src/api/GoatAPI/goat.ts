import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";

// 🔍 Busca todas as cabras cadastradas (sem paginação)
export async function getAllGoats(): Promise<GoatResponseDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms/goats`);
  if (!res.ok) throw new Error("Erro ao buscar cabras");
  const data = await res.json();
  return data.content;
}

// 🔍 Busca cabras por nome e fazenda
export async function searchGoatsByNameAndFarmId(
  farmId: number,
  name: string
): Promise<GoatResponseDTO[]> {
  const res = await fetch(
    `${BASE_URL}/goatfarms/${farmId}/goats/name?name=${encodeURIComponent(name)}`
  );
  if (!res.ok) throw new Error("Erro ao buscar cabras pelo nome e fazenda");
  const data = await res.json();
  return data.content;
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
  const res = await fetch(`${BASE_URL}/goatfarms/${farmId}/goats?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Erro ao buscar cabras da fazenda com paginação");
  return await res.json();
}

// ✅ Criação de nova cabra
export async function createGoat(
  goatData: GoatRequestDTO
): Promise<GoatResponseDTO> {
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

// ✅ Atualização de cabra existente
export async function updateGoat(
  registrationNumber: string,
  goat: GoatRequestDTO
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/goatfarms/goats/${registrationNumber}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(goat),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao atualizar a cabra");
  }
}
