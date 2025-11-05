import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import { requestBackEnd } from "../../utils/request";
import { toGoatGenealogyDTO } from "../../Convertes/genealogies/normalizeGenealogyResponse";

// Alinhado ao backend refatorado: rotas aninhadas sob farmId/goatId
export async function getGenealogy(farmId: number, goatId: string): Promise<GoatGenealogyDTO> {
  const response = await requestBackEnd({
    url: `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/genealogies`,
    method: "GET"
  });
  const raw = response.data?.data ?? response.data;
  return toGoatGenealogyDTO(raw);
}

export async function createGenealogy(farmId: number, goatId: string): Promise<void> {
  await requestBackEnd({
    url: `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/genealogies`,
    method: "POST"
  });
}
