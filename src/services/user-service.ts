import axios, { AxiosResponse } from 'axios';
import { UserRequestDTO, UserResponseDTO, UserValidationErrors } from '../types/user.types';
import { ApiError, ErrorCodes } from './goat-farm-service';

// Configuração da API
const API_BASE_URL = 'http://localhost:8080';
const USER_ENDPOINT = '/users';

console.log('🔧 User Service - API Base URL:', API_BASE_URL);
console.log('🔧 User Service - User Endpoint:', USER_ENDPOINT);

// Instância do axios para usuários
const userApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição (autenticação removida temporariamente)
userApiClient.interceptors.request.use(
  (config) => {
    // Token removido temporariamente para testes
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    //   console.log('🔐 User Service - Token adicionado à requisição');
    // } else {
    //   console.log('⚠️ User Service - Nenhum token encontrado');
    // }
    
    console.log('📤 User Service - Enviando requisição:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: 'Auth removed for testing'
    });
    
    return config;
  },
  (error) => {
    console.error('❌ User Service - Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta
userApiClient.interceptors.response.use(
  (response) => {
    console.log('📥 User Service - Resposta recebida:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('❌ User Service - Erro na resposta:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 500) {
      console.error('🚨 User Service - Erro 500 detectado:', {
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
 * Cria um novo usuário
 */
export const createUser = async (userData: UserRequestDTO): Promise<UserResponseDTO> => {
  try {
    console.log('🚀 User Service - Iniciando cadastro de usuário:', userData);
    
    // Validar dados antes de enviar
    const validationErrors = validateUserData(userData);
    if (Object.keys(validationErrors).length > 0) {
      console.error('❌ User Service - Dados inválidos:', validationErrors);
      throw createApiError('Dados de usuário inválidos', 400, ErrorCodes.VALIDATION_ERROR, validationErrors);
    }
    
    const response: AxiosResponse<UserResponseDTO> = await userApiClient.post(USER_ENDPOINT, userData);
    
    console.log('✅ User Service - Usuário criado com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ User Service - Erro ao criar usuário:', error);
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
  
  // Validar CPF
  if (!data.cpf || data.cpf.replace(/\D/g, '').length !== 11) {
    errors.cpf = 'CPF deve ter 11 dígitos';
  }
  
  return errors;
};

/**
 * Trata erros específicos do serviço de usuários
 */
export const handleUserError = (error: any): ApiError => {
  if (error.response) {
    const { status, data } = error.response;
    
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
      case 500:
        return createApiError(
          `Erro interno do servidor. Verifique se o backend está rodando em ${API_BASE_URL}`,
          500,
          ErrorCodes.SERVER_ERROR
        );
      default:
        return createApiError(
          data?.message || `Erro HTTP ${status}`,
          status,
          ErrorCodes.SERVER_ERROR
        );
    }
  } else if (error.request) {
    return createApiError(
      `Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_BASE_URL}`,
      0,
      ErrorCodes.NETWORK_ERROR
    );
  } else {
    return createApiError(
      error.message || 'Erro desconhecido',
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
  details?: any
): ApiError => {
  return {
    message,
    status,
    code,
    details,
  };
};