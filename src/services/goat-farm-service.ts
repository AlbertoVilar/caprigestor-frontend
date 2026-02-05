// src/services/goat-farm-service.ts
import axios, { AxiosResponse } from 'axios';
import { 
  GoatFarmRequestDTO, 
  GoatFarmFullRequestDTO, 
  GoatFarmResponse, 
  GoatFarmValidationError
} from '../types/goat-farm.types';
// import { getAccessToken } from './auth-service'; // Removido temporariamente para testes

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const GOAT_FARMS_ENDPOINT = '/goatfarms';

// Log da configuração da API
console.log('🔧 API Configuration:', {
  baseUrl: API_BASE_URL,
  endpoint: GOAT_FARMS_ENDPOINT,
  fullEndpoint: `${API_BASE_URL}${GOAT_FARMS_ENDPOINT}`
});

// Instância do axios configurada para fazendas de cabras
const goatFarmApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para log de requisições (autenticação removida temporariamente)
goatFarmApi.interceptors.request.use(
  (config) => {
    // Token removido temporariamente para testes
    // const token = getAccessToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // Log detalhado da requisição para debug
    console.log('🐐 GoatFarm API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      fullUrl: `${config.baseURL}${config.url}`,
      data: config.data,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': 'Removed for testing'
      },
      timestamp: new Date().toISOString()
    });
    
    // Log específico dos dados sendo enviados
    if (config.data) {
      console.log('📋 Request Data Details:', {
        farm: config.data.farm,
        user: config.data.user ? {
          ...config.data.user,
          password: '[HIDDEN]',
          confirmPassword: '[HIDDEN]'
        } : undefined,
        address: config.data.address,
        phones: config.data.phones
      });
    }
    
    return config;
  },
  (error) => {
    console.error('🐐 GoatFarm API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
goatFarmApi.interceptors.response.use(
  (response) => {
    console.log('✅ GoatFarm API Success Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    // Log detalhado do erro
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ GoatFarm API Error Response:', errorDetails);
    
    // Log específico para erro 500
    if (error.response?.status === 500) {
      console.error('🚨 ERRO 500 - Detalhes completos:', {
        requestData: error.config?.data,
        responseData: error.response?.data,
        headers: error.config?.headers,
        fullError: error
      });
    }
    
    return Promise.reject(error);
  }
);

// Interface para resposta da API
interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
}

// Interface para erros da API
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  errors?: GoatFarmValidationError[];
}

// Enum para códigos de erro
enum ErrorCodes {
  FARM_NAME_ALREADY_EXISTS = 'FARM_NAME_ALREADY_EXISTS',
  TOD_ALREADY_EXISTS = 'TOD_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  CPF_ALREADY_EXISTS = 'CPF_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_DATA = 'INVALID_DATA',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * Cadastro simples de fazenda de cabras
 * Endpoint: POST /goatfarms
 * Permissões: ROLE_ADMIN ou ROLE_OPERATOR
 */
export async function createGoatFarm(farmData: GoatFarmRequestDTO): Promise<ApiResponse<GoatFarmResponse>> {
  try {
    validateGoatFarmData(farmData);
    
    const response: AxiosResponse<GoatFarmResponse> = await goatFarmApi.post(
      GOAT_FARMS_ENDPOINT,
      farmData
    );
    
    return {
      data: response.data,
      message: 'Fazenda cadastrada com sucesso!',
      status: response.status
    };
  } catch (error: unknown) {
    console.error('Erro ao cadastrar fazenda:', error);
    throw handleGoatFarmError(error);
  }
}

/**
 * Cadastro completo de fazenda de cabras
 * Endpoint: POST /goatfarms/full
 * Permissões: ROLE_ADMIN ou ROLE_OPERATOR
 * Cria fazenda, usuário, endereço e telefones em uma única operação
 */
export async function createGoatFarmFull(farmData: GoatFarmFullRequestDTO): Promise<ApiResponse<GoatFarmResponse>> {
  try {
    validateGoatFarmFullData(farmData);
    
    const response: AxiosResponse<GoatFarmResponse> = await goatFarmApi.post(
      `${GOAT_FARMS_ENDPOINT}/full`,
      farmData
    );
    
    return {
      data: response.data,
      message: 'Fazenda cadastrada com sucesso (cadastro completo)!',
      status: response.status
    };
  } catch (error: unknown) {
    console.error('Erro ao cadastrar fazenda (completo):', error);
    throw handleGoatFarmError(error);
  }
}

/**
 * Validação dos dados para cadastro simples
 */
function validateGoatFarmData(farmData: GoatFarmRequestDTO): void {
  const errors: string[] = [];
  
  if (!farmData.name || farmData.name.trim().length === 0) {
    errors.push('Nome da fazenda é obrigatório');
  }
  
  if (farmData.tod && farmData.tod.length !== 5) {
    errors.push('TOD deve ter exatamente 5 caracteres');
  }
  
  if (!farmData.addressId || farmData.addressId <= 0) {
    errors.push('ID do endereço é obrigatório');
  }
  
  if (!farmData.userId || farmData.userId <= 0) {
    errors.push('ID do usuário é obrigatório');
  }
  
  if (!farmData.phoneIds || farmData.phoneIds.length === 0) {
    errors.push('Pelo menos um telefone deve ser informado');
  }
  
  if (errors.length > 0) {
    throw createApiError(
      'Dados inválidos para cadastro de fazenda',
      400,
      ErrorCodes.VALIDATION_ERROR,
      { validationErrors: errors }
    );
  }
}

/**
 * Validação dos dados para cadastro completo
 */
function validateGoatFarmFullData(farmData: GoatFarmFullRequestDTO): void {
  const errors: string[] = [];
  
  // Validação da fazenda
  if (!farmData.farm.name || farmData.farm.name.trim().length === 0) {
    errors.push('Nome da fazenda é obrigatório');
  }
  
  if (farmData.farm.tod && farmData.farm.tod.length !== 5) {
    errors.push('TOD deve ter exatamente 5 caracteres');
  }
  
  // Validação do usuário
  if (!farmData.user.name || farmData.user.name.length < 2 || farmData.user.name.length > 100) {
    errors.push('Nome do usuário deve ter entre 2 e 100 caracteres');
  }
  
  if (!farmData.user.email || !isValidEmail(farmData.user.email)) {
    errors.push('Email válido é obrigatório');
  }
  
  if (!farmData.user.cpf || farmData.user.cpf.length !== 11 || !/^\d{11}$/.test(farmData.user.cpf)) {
    errors.push('CPF deve ter exatamente 11 dígitos numéricos');
  }
  
  if (!farmData.user.password || farmData.user.password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }
  
  if (farmData.user.password !== farmData.user.confirmPassword) {
    errors.push('Senha e confirmação devem coincidir');
  }
  
  // Validação do endereço
  if (!farmData.address.street || farmData.address.street.length > 255) {
    errors.push('Rua é obrigatória (máx. 255 caracteres)');
  }
  
  if (!farmData.address.neighborhood || farmData.address.neighborhood.length > 100) {
    errors.push('Bairro é obrigatório (máx. 100 caracteres)');
  }
  
  if (!farmData.address.city || farmData.address.city.length > 100) {
    errors.push('Cidade é obrigatória (máx. 100 caracteres)');
  }
  
  if (!farmData.address.state || farmData.address.state.length > 50) {
    errors.push('Estado é obrigatório (máx. 50 caracteres)');
  }
  
  if (!farmData.address.zipCode || !isValidBrazilianPostalCode(farmData.address.zipCode)) {
    errors.push('CEP deve estar no formato XXXXX-XXX');
  }
  
  if (!farmData.address.country || farmData.address.country.length > 100) {
    errors.push('País é obrigatório (máx. 100 caracteres)');
  }
  
  // Validação dos telefones
  if (!farmData.phones || farmData.phones.length === 0) {
    errors.push('Pelo menos um telefone deve ser informado');
  } else {
    farmData.phones.forEach((phone, index) => {
      if (!phone.ddd || phone.ddd.length !== 2 || !/^\d{2}$/.test(phone.ddd)) {
        errors.push(`Telefone ${index + 1}: DDD deve ter exatamente 2 dígitos`);
      }
      
      if (!phone.number || (phone.number.length !== 8 && phone.number.length !== 9) || !/^\d{8,9}$/.test(phone.number)) {
        errors.push(`Telefone ${index + 1}: Número deve ter 8 ou 9 dígitos`);
      }
    });
  }
  
  if (errors.length > 0) {
    throw createApiError(
      'Dados inválidos para cadastro completo de fazenda',
      400,
      ErrorCodes.VALIDATION_ERROR,
      { validationErrors: errors }
    );
  }
}

/**
 * Validação de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validação de CEP brasileiro
 */
function isValidBrazilianPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^\d{5}-\d{3}$/;
  return postalCodeRegex.test(postalCode);
}

/**
 * Tratamento de erros das requisições
 */
function handleGoatFarmError(error: unknown): ApiError {
  const response = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number; data?: { message?: string; errors?: GoatFarmValidationError[] } } }).response
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
          data?.message || 'Dados inválidos',
          400,
          ErrorCodes.VALIDATION_ERROR,
          data?.errors || data
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
      
      case 409: {
        // Conflito - dados duplicados
        let conflictMessage = 'Dados já existem no sistema';
        if (data?.message) {
          if (data.message.includes('name')) {
            conflictMessage = 'Nome da fazenda já existe';
          } else if (data.message.includes('tod')) {
            conflictMessage = 'TOD já existe';
          } else if (data.message.includes('email')) {
            conflictMessage = 'Email já existe';
          } else if (data.message.includes('cpf')) {
            conflictMessage = 'CPF já existe';
          } else if (data.message.includes('phone')) {
            conflictMessage = 'Telefone já existe';
          }
        }
        
        return createApiError(
          conflictMessage,
          409,
          ErrorCodes.FARM_NAME_ALREADY_EXISTS,
          data
        );
      }
      
      case 500:
        return createApiError(
          'Erro interno do servidor. Tente novamente mais tarde.',
          500,
          ErrorCodes.SERVER_ERROR
        );
      
      default:
        return createApiError(
          data?.message || 'Erro desconhecido',
          status ?? 500,
          ErrorCodes.SERVER_ERROR,
          data
        );
    }
  } else if (request) {
    return createApiError(
      'Erro de conexão. Verifique sua internet.',
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
}

/**
 * Criação de erro padronizado
 */
function createApiError(message: string, status?: number, code?: ErrorCodes, details?: unknown): ApiError {
  return {
    message,
    status,
    code,
    details
  };
}

// Exportar tipos e enums para uso em outros arquivos
export { ErrorCodes, type ApiError, type ApiResponse };
