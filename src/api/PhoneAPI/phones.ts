import { PhoneRequest } from "../../Models/PhoneRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";
import { CustomAPIError } from "../CustomError/CustomAPIError"; // <-- **Caminho de importação ATUALIZADO**

export async function createPhone(data: PhoneRequest): Promise<number> {
  const res = await fetch(`${BASE_URL}/phones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    const errorResponse: CustomAPIError = { status: res.status, message: errorBody };
    throw errorResponse;
  }
  const result = await res.json();
  return result.id;
}