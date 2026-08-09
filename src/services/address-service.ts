import axios, { AxiosResponse } from 'axios';
import { AddressRequestDTO, AddressResponseDTO, AddressValidationErrors } from '../types/address.types';
import { ApiError, ErrorCodes } from './goat-farm-service';
import { resolveApiBaseUrl } from '../utils/apiConfig';

// Configuração da API
const API_BASE_URL = resolveApiBaseUrl();
const ADDRESS_ENDPOINT = '/addresses';

console.log('🔧 Address Service - API Base URL:', API_BASE_URL);
console.log('🔧 Address Service - Address Endpoint:', ADDRESS_ENDPOINT);

// Instância do axios para endereços
const addressApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição (autenticação removida temporariamente)
addressApiClient.interceptors.request.use(
  (config) => {
    // Token removido temporariamente para testes
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    //   console.log('🔐 Address Service - Token adicionado à requisição');
    // } else {
    //   console.log('⚠️ Address Service - Nenhum token encontrado');
    // }
    
    console.log('📤 Address Service - Enviando requisição:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: 'Auth removed for testing'
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Address Service - Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta
addressApiClient.interceptors.response.use(
  (response) => {
    console.log('📥 Address Service - Resposta recebida:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('❌ Address Service - Erro na resposta:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 500) {
      console.error('🚨 Address Service - Erro 500 detectado:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        response: error.response?.data
      });
    }
    
    return Promise.reject(error);
  }
);

/**
 * Cria um novo endereço
 */
export const createAddress = async (addressData: AddressRequestDTO): Promise<AddressResponseDTO> => {
  try {
    console.log('🚀 Address Service - Iniciando cadastro de endereço:', addressData);
    
    // Validar dados antes de enviar
    const validationErrors = validateAddressData(addressData);
    if (Object.keys(validationErrors).length > 0) {
      console.error('❌ Address Service - Dados inválidos:', validationErrors);
      throw createApiError('Dados de endereço inválidos', 400, ErrorCodes.VALIDATION_ERROR, validationErrors);
    }
    
    const response: AxiosResponse<AddressResponseDTO> = await addressApiClient.post(ADDRESS_ENDPOINT, addressData);
    
    console.log('✅ Address Service - Endereço criado com sucesso:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('❌ Address Service - Erro ao criar endereço:', error);
    throw handleAddressError(error);
  }
};

/**
 * Valida os dados do endereço
 */
export const validateAddressData = (data: AddressRequestDTO): AddressValidationErrors => {
  const errors: AddressValidationErrors = {};
  
  // Validar rua
  if (!data.street || data.street.trim().length < 5) {
    errors.street = 'Rua deve ter pelo menos 5 caracteres';
  } else if (data.street.trim().length > 200) {
    errors.street = 'Rua deve ter no máximo 200 caracteres';
  }
  
  // Validar cidade
  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'Cidade deve ter pelo menos 2 caracteres';
  } else if (data.city.trim().length > 100) {
    errors.city = 'Cidade deve ter no máximo 100 caracteres';
  }
  
  // Validar estado
  if (!data.state || data.state.trim().length < 2) {
    errors.state = 'Estado deve ter pelo menos 2 caracteres';
  } else if (data.state.trim().length > 50) {
    errors.state = 'Estado deve ter no máximo 50 caracteres';
  }
  
  // Validar CEP
  const zipCodeRegex = /^\d{5}-?\d{3}$/;
  if (!data.zipCode || !zipCodeRegex.test(data.zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'))) {
    errors.zipCode = 'CEP deve ter o formato 12345-678';
  }
  
  // Validar país
  if (!data.country || data.country.trim().length < 2) {
    errors.country = 'País deve ter pelo menos 2 caracteres';
  } else if (data.country.trim().length > 50) {
    errors.country = 'País deve ter no máximo 50 caracteres';
  }
  
  return errors;
};

/**
 * Trata erros específicos do serviço de endereços
 */
export const handleAddressError = (error: unknown): ApiError => {
  const response = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number; data?: { message?: string; errors?: AddressValidationErrors } } }).response
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
          data?.message || 'Endereço já existe',
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
  details?: AddressValidationErrors | Record<string, unknown>
): ApiError => {
  return {
    message,
    status,
    code,
    details,
  };
};

