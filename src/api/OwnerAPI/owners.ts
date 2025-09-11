import { OwnerRequest } from "../../Models/OwnerRequestDTO";
import { requestBackEnd } from "../../utils/request";

// ✅ Criar novo proprietário
export async function createOwner(data: OwnerRequest): Promise<number> {
  const response = await requestBackEnd({
    url: "/owners",
    method: "POST",
    data
  });
  
  return response.data.id;
}

// ✅ Buscar proprietário por ID
export async function getOwnerById(ownerId: number): Promise<OwnerRequest> {
  const response = await requestBackEnd({
    url: `/owners/${ownerId}`,
    method: "GET"
  });

  return response.data;
}
