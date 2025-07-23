import { OwnerRequest } from "../../Models/OwnerRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";

// ✅ Criar novo proprietário
export async function createOwner(data: OwnerRequest): Promise<number> {
  const res = await fetch(`${BASE_URL}/owners`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Erro ao criar proprietário");
  const result = await res.json();
  return result.id;
}

// ✅ Buscar proprietário por ID
export async function getOwnerById(ownerId: number): Promise<OwnerRequest> {
  const response = await fetch(`${BASE_URL}/owners/${ownerId}`);

  if (!response.ok) {
    throw new Error("Erro ao buscar proprietário");
  }

  const data: OwnerRequest = await response.json();
  return data;
}
