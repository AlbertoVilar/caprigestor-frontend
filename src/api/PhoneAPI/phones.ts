import { PhonesRequestDTO } from "../../Models/PhoneRequestDTO";
import { requestBackEnd } from "../../utils/request";
import { CustomAPIError } from "../CustomError/CustomAPIError";

export async function createPhone(data: PhonesRequestDTO): Promise<number> {
  try {
    const response = await requestBackEnd({
      url: "/phones",
      method: "POST",
      data
    });
    
    return response.data.id;
  } catch (error: unknown) {
    const response = typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { status?: number; data?: unknown } }).response
      : undefined;
    const status = response?.status ?? 500;
    const message = typeof response?.data === "string"
      ? response?.data
      : error instanceof Error
        ? error.message
        : "Erro ao criar telefone.";
    const errorResponse: CustomAPIError = { status, message };
    throw errorResponse;
  }
}
