// Serviço para interagir com a API de usuários
// Substitui o OwnerAPI - todos os endpoints requerem autenticação

import { UserProfile, UserCreateRequest } from "../../Models/UserProfileDTO";
import { requestBackEnd } from "../../utils/request";

/**
 * Busca o perfil do usuário logado
 * Endpoint: GET /users/me
 * Requer: Autenticação JWT
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  try {
    const response = await requestBackEnd.get("/users/me");
    return response.data;
  } catch (error: unknown) {
    const errorMessage = typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : undefined;
    console.error("Erro em getCurrentUserProfile:", error);
    throw new Error(errorMessage || "Erro ao buscar perfil do usuário");
  }
}

/**
 * Cria um novo usuário (registro)
 * Endpoint: POST /users
 * Requer: Autenticação JWT (apenas admin pode criar outros usuários)
 */
export async function createUser(data: UserCreateRequest): Promise<UserProfile> {
  try {
    const response = await requestBackEnd.post("/users", data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : undefined;
    console.error("Erro em createUser:", error);
    throw new Error(errorMessage || "Erro ao criar usuário");
  }
}

// Função de compatibilidade para substituir getOwnerByUserId
// Redireciona para getCurrentUserProfile()
export async function getOwnerByUserId(userId: number): Promise<UserProfile> {
  console.warn(`getOwnerByUserId(${userId}) está deprecated. Use getCurrentUserProfile() diretamente.`);
  return await getCurrentUserProfile();
}
