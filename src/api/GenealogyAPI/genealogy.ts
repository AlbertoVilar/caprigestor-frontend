import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import { requestBackEnd } from "../../utils/request";

export async function getGenealogyByRegistration(registrationNumber: string): Promise<GoatGenealogyDTO> {
  const response = await requestBackEnd({
    url: `/genealogies/${registrationNumber}`,
    method: "GET"
  });
  return response.data;
}

export async function createGenealogy(registrationNumber: string): Promise<void> {
  await requestBackEnd({
    url: `/genealogies/${registrationNumber}`,
    method: "POST"
  });
}
