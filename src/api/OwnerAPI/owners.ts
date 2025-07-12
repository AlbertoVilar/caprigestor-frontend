import { OwnerRequest } from "../../Models/OwnerRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";

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
