import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import { BASE_URL } from "../../utils/apiConfig";

export async function getGenealogyByRegistration(registrationNumber: string): Promise<GoatGenealogyDTO> {
  const res = await fetch(`${BASE_URL}/genealogies/${registrationNumber}`);
  if (!res.ok) throw new Error("Erro ao buscar genealogia");
  return await res.json();
}