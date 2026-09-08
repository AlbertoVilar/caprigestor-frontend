import { AxiosResponse } from 'axios';
import { UserRequestDTO, UserResponseDTO, UserValidationErrors } from '../types/user.types';
import { ApiError, ErrorCodes } from './goat-farm-service';
import { resolveApiBaseUrl } from '../utils/apiConfig';
import { requestBackEnd } from '../utils/request';

// Configuração da API
const API_BASE_URL = resolveApiBaseUrl();
const USER_ENDPOINT = '/users';

// All requests go through the shared authenticated client.

/**
 * Cria um novo usuário
 */
export const createUser = async (userData: UserRequestDTO): Promise<UserResponseDTO> => {
  try {
    // Validar dados antes de enviar
    const validationErrors = validateUserData(userData);
    if (Object.keys(validationErrors).length > 0) {
      throw createApiError('Dados de usuário inválidos', 400, ErrorCodes.VALIDATION_ERROR, validationErrors);
    }
    
    const response: AxiosResponse<UserResponseDTO> = await requestBackEnd.post(USER_ENDPOINT, userData);
    return response.data;
  } catch (error: unknown) {
    throw handleUserError(error);
  }
};

/**
 * Valida os dados do usuário
 */
export const validateUserData = (data: UserRequestDTO): UserValidationErrors => {
  const errors: UserValidationErrors = {};
  
  // Validar nome
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Nome deve ter no máximo 100 caracteres';
  }
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Email deve ter um formato válido';
  }
  
  // Validar senha
  if (!data.password || data.password.length < 6) {
    errors.password = 'Senha deve ter pelo menos 6 caracteres';
  } else if (data.password.length > 50) {
    errors.password = 'Senha deve ter no máximo 50 caracteres';
  }
  
  if (data.confirmPassword !== undefined && data.confirmPassword !== data.password) {
    errors.password = 'Senha e confirmação de senha devem coincidir';
  }
  
  // Validar CPF
  if (!data.cpf || data.cpf.replace(/\D/g, '').length !== 11) {
    errors.cpf = 'CPF deve ter 11 dígitos';
  }
  
  return errors;
};

/**
 * Trata erros específicos do serviço de usuários
 */
export const handleUserError = (error: unknown): ApiError => {
  const response = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number; data?: { message?: string; errors?: UserValidationErrors } } }).response
    : undefined;
  const request = typeof error === "object" && error !== null && "request" in error
    ? (error as { request?: unknown }).request
    : undefined;
  const message = error instanceof Error ? error.message : undefined;

  if (response) {
    const { status, data } = response;
    
    switch (status) {
      case 400:
        return createApiError(
          data?.message || 'Dados inválidos fornecidos',
          400,
          ErrorCodes.VALIDATION_ERROR,
          data?.errors
        );
      case 401:
        return createApiError(
          'Não autorizado. Faça login novamente.',
          401,
          ErrorCodes.UNAUTHORIZED
        );
      case 403:
        return createApiError(
          'Acesso negado. Você não tem permissão para esta operação.',
          403,
          ErrorCodes.FORBIDDEN
        );
      case 409:
        return createApiError(
          data?.message || 'Usuário já existe com este email ou CPF',
          409,
          ErrorCodes.DUPLICATE_ENTRY
        );
      case 404:
        return createApiError(
          data?.message || 'Recurso não encontrado',
          404,
          ErrorCodes.INVALID_DATA
        );
      case 422:
        return createApiError(
          data?.message || 'Regra de negocio violada. Revise os dados enviados.',
          422,
          ErrorCodes.VALIDATION_ERROR,
          data?.errors
        );
      case 500:
        return createApiError(
          `Erro interno do servidor. Verifique se o backend está rodando em ${API_BASE_URL}`,
          500,
          ErrorCodes.SERVER_ERROR
        );
      default:
        return createApiError(
          data?.message || `Erro HTTP ${status}`,
          status ?? 500,
          ErrorCodes.SERVER_ERROR
        );
    }
  } else if (request) {
    return createApiError(
      `Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_BASE_URL}`,
      0,
      ErrorCodes.NETWORK_ERROR
    );
  } else {
    return createApiError(
      message || 'Erro desconhecido',
      0,
      ErrorCodes.SERVER_ERROR
    );
  }
};

/**
 * Cria um objeto de erro padronizado
 */
const createApiError = (
  message: string,
  status: number,
  code: ErrorCodes,
  details?: UserValidationErrors | Record<string, unknown>
): ApiError => {
  return {
    message,
    status,
    code,
    details,
  };
};

