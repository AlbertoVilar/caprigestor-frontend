import { AddressRequest } from "../../Models/AddressRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";
import { requestBackEnd } from "../../utils/request";

export async function createAddress(data: AddressRequest): Promise<number> {
  try {
    const response = await requestBackEnd.post("/address", data);
    return response.data.id;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao criar endereço";
    throw new Error(errorMessage);
  }
}
