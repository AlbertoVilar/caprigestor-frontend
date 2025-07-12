import { AddressRequest } from "../../Models/AddressRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";

export async function createAddress(data: AddressRequest): Promise<number> {
  const res = await fetch(`${BASE_URL}/address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Erro ao criar endereço");
  const result = await res.json();
  return result.id;
}
