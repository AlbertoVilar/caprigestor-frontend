import type { GoatDTO } from "../../Models/goatDTO";

import { BASE_URL } from "../../utils/apiConfig";



export async function getAllGoats(): Promise<GoatDTO[]> {
  const res = await fetch(`${BASE_URL}/goatfarms/goats`);
  if (!res.ok) throw new Error("Erro ao buscar cabras");
  const data = await res.json();
  return data.content; // 👈 Certo, se o backend retorna um objeto paginado
}
