import { PhonesRequestDTO } from "../../Models/PhoneRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";
import { requestBackEnd } from "../../utils/request";
import { CustomAPIError } from "../CustomError/CustomAPIError";

export async function createPhone(data: PhonesRequestDTO): Promise<number> {
  try {
    const response = await requestBackEnd.post("/phones", data);
    return response.data.id;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao criar telefone";
    throw new Error(errorMessage);
  }
}
