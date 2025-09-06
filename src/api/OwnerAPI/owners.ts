import { OwnerRequest } from "../../Models/OwnerRequestDTO";
import { BASE_URL } from "../../utils/apiConfig";
import { requestBackEnd } from "../../utils/request";

// ✅ Criar novo proprietário
export async function createOwner(data: OwnerRequest): Promise<number> {
  try {
    const response = await requestBackEnd.post("/owners", data);
    return response.data.id;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao criar proprietário";
    throw new Error(errorMessage);
  }
}

// ✅ Buscar proprietário por ID
export async function getOwnerById(ownerId: number): Promise<OwnerRequest> {
  try {
    const response = await requestBackEnd.get(`/owners/${ownerId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar proprietário";
    throw new Error(errorMessage);
  }
}

// ✅ Buscar proprietário por userId (do token JWT)
export async function getOwnerByUserId(userId: number): Promise<OwnerRequest | null> {
  try {
    const response = await requestBackEnd.get(`/owners/user/${userId}`);
    return response.data;
  } catch (error: any) {
    // Se não encontrar (404), retorna null ao invés de erro
    if (error.response?.status === 404) {
      return null;
    }
    const errorMessage = error.response?.data?.message || error.message || "Erro ao buscar proprietário por userId";
    throw new Error(errorMessage);
  }
}
