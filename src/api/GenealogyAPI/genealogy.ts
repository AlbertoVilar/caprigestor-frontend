import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import { BASE_URL } from "../../utils/apiConfig";
import { requestBackEnd } from "../../utils/request";

export async function getGenealogyByRegistration(registrationNumber: string): Promise<GoatGenealogyDTO> {
  try {
    const response = await requestBackEnd.get(`/genealogies/${registrationNumber}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar genealogia";
    throw new Error(errorMessage);
  }
}

export async function createGenealogy(registrationNumber: string): Promise<void> {
  try {
    await requestBackEnd.post(`/genealogies/${registrationNumber}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao criar genealogia";
    throw new Error(errorMessage);
  }
}
