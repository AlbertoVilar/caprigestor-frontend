import { AxiosResponse } from 'axios';
import { PhoneRequestDTO, PhoneResponseDTO, PhoneValidationErrors, PhoneType } from '../types/phone.types';
import { ApiError, ErrorCodes } from './goat-farm-service';
import { resolveApiBaseUrl } from '../utils/apiConfig';
import { requestBackEnd } from '../utils/request';

// Configuração da API
const API_BASE_URL = resolveApiBaseUrl();
const PHONE_ENDPOINT = '/phones';

// All requests go through the shared authenticated client and interceptor.

/**
 * Cria um novo telefone
 */
export const createPhone = async (phoneData: PhoneRequestDTO): Promise<PhoneResponseDTO> => {
  try {
    // Validar dados antes de enviar
    const validationErrors = validatePhoneData(phoneData);
    if (Object.keys(validationErrors).length > 0) {
      throw createApiError('Dados de telefone inválidos', 400, ErrorCodes.VALIDATION_ERROR, validationErrors);
    }
    
    const response: AxiosResponse<PhoneResponseDTO> = await requestBackEnd.post(PHONE_ENDPOINT, phoneData);
    return response.data;
  } catch (error: unknown) {
    throw handlePhoneError(error);
  }
};

/**
 * Valida os dados do telefone
 */
export const validatePhoneData = (data: PhoneRequestDTO): PhoneValidationErrors => {
  const errors: PhoneValidationErrors = {};
  
  // Validar número
  const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
  const cleanNumber = data.number?.replace(/\D/g, '') || '';
  
  if (!data.number || cleanNumber.length < 10 || cleanNumber.length > 11) {
    errors.number = 'Número deve ter 10 ou 11 dígitos (com DDD)';
  } else if (!phoneRegex.test(data.number)) {
    errors.number = 'Formato inválido. Use: (11) 99999-9999 ou 11999999999';
  }
  
  // Validar tipo
  const validTypes: PhoneType[] = ['MOBILE', 'HOME', 'WORK'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.type = 'Tipo deve ser MOBILE, HOME ou WORK';
  }
  
  return errors;
};

/**
 * Trata erros específicos do serviço de telefones
 */
export const handlePhoneError = (error: unknown): ApiError => {
  const response = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number; data?: { message?: string; errors?: PhoneValidationErrors } } }).response
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
          data?.message || 'Telefone já existe',
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
  details?: PhoneValidationErrors | Record<string, unknown>
): ApiError => {
  return {
    message,
    status,
    code,
    details,
  };
};

