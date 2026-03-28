// src/services/auth-service.ts
import axios, { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";

import { CredentialsDTO, AccessTokenPayloadDTO, RoleEnum } from "../Models/auth";
import { requestBackEnd } from "../utils/request";
import { resolveApiBaseUrl } from "../utils/apiConfig";
import * as accessTokenRepository from "../localstorage/access-token-repository";

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
}

interface UserRegistrationData extends UserFormData {
  username: string;
  roles: string[];
}

interface RegistrationResponse {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  roles?: string[];
  createdAt?: string;
  token?: string;
  accessToken?: string;
  access_token?: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface PasswordResetRequestData {
  email: string;
}

interface PasswordResetConfirmData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiError {
  message: string;
  status?: number;
  code?: ErrorCodes;
  details?: unknown;
}

enum ErrorCodes {
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_DATA = 'INVALID_DATA',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// Lista de endpoints públicos que não precisam de autenticação
const PUBLIC_ENDPOINTS = [
  '/oauth2/token',
  '/oauth/token', 
  '/auth/login',
  '/auth/refresh',
  '/auth/register-farm',
  '/auth/password-reset/request',
  '/auth/password-reset/confirm',
  '/genealogies',
];

// Lista de endpoints GET que são públicos (sem autenticação)
// Observação importante: o match é ESTRITO ao endpoint raiz.
// Ex.: '/goats' é público, mas '/goats/{id}/events' NÃO é.
const PUBLIC_GET_ENDPOINTS = [
  '/genealogies',
  '/goatfarms', // Listagem de fazendas é pública
  '/goats',     // Somente raiz '/goats' (listagem); caminhos aninhados exigem AUTH
  // Adicione aqui outros endpoints GET que devem ser públicos
];

/**
 * Ajuste a URL conforme seu backend:
 * - Spring Authorization Server moderno: "/oauth2/token"
 * - Stack antiga do Spring Security OAuth: "/oauth/token"
 */
export function loginRequest(loginData: CredentialsDTO) {
  const headers = {
    "Content-Type": "application/json",
  };

  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/auth/login",
    data: loginData,
    headers,
  };

  return requestBackEnd(config).then(response => {
    console.log('🔍 DEBUG: Resposta do login:', response.data);
    
    // Suporte para diferentes formatos de resposta do backend
    const accessToken = response.data.accessToken || response.data.access_token;
    const refreshToken = response.data.refreshToken || response.data.refresh_token;
    
    // Salva o access token
    if (accessToken) {
      console.log('🔍 DEBUG: Salvando accessToken:', accessToken.substring(0, 20) + '...');
      saveAccessToken(accessToken);
    } else {
      console.warn('⚠️ WARNING: Nenhum access token encontrado na resposta do login');
    }
    
    // Salva o refresh token se disponível
    if (refreshToken) {
      console.log('🔍 DEBUG: Salvando refreshToken:', refreshToken.substring(0, 20) + '...');
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      console.warn('⚠️ WARNING: Nenhum refresh token encontrado na resposta do login');
      console.log('📋 INFO: Campos disponíveis na resposta:', Object.keys(response.data));
    }
    
    return response;
  });
}

/**
 * Registra um novo usuário no sistema
 * @param formData - Dados do formulário de cadastro
 * @returns Promise com a resposta tipada da API
 * @throws ApiError com detalhes específicos do erro
 */
export function requestPasswordReset(data: PasswordResetRequestData) {
  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/auth/password-reset/request",
    data,
    headers: {
      "Content-Type": "application/json",
    },
  };

  return requestBackEnd(config);
}

export function confirmPasswordReset(data: PasswordResetConfirmData) {
  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/auth/password-reset/confirm",
    data,
    headers: {
      "Content-Type": "application/json",
    },
  };

  return requestBackEnd(config);
}

export async function registerUser(formData: UserFormData): Promise<ApiResponse<RegistrationResponse>> {
  try {
    // Validações de entrada
    validateFormData(formData);

    // Prepara payload limpo para o backend
    const registrationData: UserRegistrationData = {
      name: formData.name.trim(),
      username: formData.email.trim(),
      email: formData.email.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      cpf: formData.cpf.replace(/\D/g, ''),
      roles: ['ROLE_OPERATOR']
    };

    console.log('🚀 ENVIANDO PARA BACKEND:');
    console.log('📦 Payload final:', JSON.stringify(registrationData, null, 2));
    console.log('🌐 URL:', '/users');

    // Cria instância axios para requisições públicas
    const publicApi = axios.create({
      baseURL: resolveApiBaseUrl(),
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // Envia requisição para o backend
    const response = await publicApi.post<RegistrationResponse>('/users', registrationData);

    console.log('📥 RESPOSTA COMPLETA DO BACKEND:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('Headers:', response.headers);
    
    return {
      data: response.data,
      status: response.status,
      message: 'Usuário registrado com sucesso'
    };

  } catch (error: unknown) {
    console.log('❌ ERRO CAPTURADO NO SERVIÇO:');
    console.log('Tipo do erro:', typeof error);
    console.log('Erro completo:', error);

    if (axios.isAxiosError(error) && error.response) {
      console.log('📊 DETALHES DO ERRO HTTP:');
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      console.log('Headers:', error.response.headers);
      console.log('Config URL:', error.config?.url);
      console.log('Config Method:', error.config?.method);
      console.log('Config Data:', error.config?.data);
    }
    
    throw handleRegistrationError(error);
  }
}

/**
 * Valida os dados do formulário
 * @param formData - Dados a serem validados
 * @throws Error com mensagem específica de validação
 */
function validateFormData(formData: UserFormData): void {
  if (!formData.name?.trim()) {
    throw createApiError('Nome é obrigatório', 400, ErrorCodes.VALIDATION_ERROR);
  }
  if (!formData.email?.trim()) {
    throw createApiError('Email é obrigatório', 400, ErrorCodes.VALIDATION_ERROR);
  }
  if (!formData.password) {
    throw createApiError('Senha é obrigatória', 400, ErrorCodes.VALIDATION_ERROR);
  }
  if (!formData.cpf?.trim()) {
    throw createApiError('CPF é obrigatório', 400, ErrorCodes.VALIDATION_ERROR);
  }
}

/**
 * Trata erros de registro de usuário
 * @param error - Erro capturado
 * @returns ApiError formatado
 */
function handleRegistrationError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
      case 409:
        return createApiError(
          'E-mail já está em uso. Tente outro e-mail.',
          409,
          ErrorCodes.EMAIL_ALREADY_EXISTS,
          data
        );
      case 400:
        return createApiError(
          data?.message || 'Dados inválidos. Verifique as informações.',
          400,
          ErrorCodes.INVALID_DATA,
          data
        );
      case 404:
        return createApiError(
          data?.message || 'Recurso nao encontrado.',
          404,
          ErrorCodes.INVALID_DATA,
          data
        );
      case 422:
        return createApiError(
          data?.message || 'Regra de negocio violada. Revise os campos enviados.',
          422,
          ErrorCodes.VALIDATION_ERROR,
          data
        );
      case 500:
        return createApiError(
          'Erro interno do servidor. Tente novamente mais tarde.',
          500,
          ErrorCodes.SERVER_ERROR,
          data
        );
      default:
        return createApiError(
          data?.message || 'Erro de comunicação com o servidor.',
          status || 0,
          ErrorCodes.NETWORK_ERROR,
          data
        );
    }
  }

  // Erro de rede ou timeout
  const errorCode = typeof error === "object" && error !== null && "code" in error
    ? (error as { code?: string }).code
    : undefined;
  const errorMessage = error instanceof Error ? error.message : undefined;
  if (errorCode === 'ECONNABORTED' || errorMessage?.includes('timeout')) {
    return createApiError(
      'Tempo limite excedido. Verifique sua conexão.',
      0,
      ErrorCodes.NETWORK_ERROR
    );
  }

  // Erro genérico
  return createApiError(
    errorMessage || 'Erro inesperado. Tente novamente.',
    0,
    ErrorCodes.SERVER_ERROR
  );
}

/**
 * Cria um objeto de erro padronizado
 * @param message - Mensagem do erro
 * @param status - Código de status HTTP
 * @param code - Código interno do erro
 * @param details - Detalhes adicionais
 * @returns ApiError formatado
 */
function createApiError(message: string, status?: number, code?: ErrorCodes, details?: unknown): ApiError {
  return {
    message,
    status,
    code,
    details
  };
}

// -------------------------
// Token storage
// -------------------------
export function saveAccessToken(token: string) {
  accessTokenRepository.save(token);
}

export function getAccessToken(): string | null {
  return accessTokenRepository.get();
}

export function logOut() {
  accessTokenRepository.remove();
  localStorage.removeItem('refresh_token');
}

// -------------------------
// Tipos seguros para o decode
// -------------------------
type RawClaims = Partial<{
  user_name: string;
  userName: string;
  sub: string;
  authorities: string[] | string;
  scope: string; // Campo scope que pode vir do JWT (contém as roles)
  exp: number | string;
  userId: number | string;
  userEmail: string;
  email: string; // Campo email alternativo
  name: string; // Campo name do JWT
}> & Record<string, unknown>;

function normalizeAuthorities(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string") {
    return input.split(/[,\s]+/).filter(Boolean);
  }
  return [];
}

// -------------------------
// Decodificação / Payload
// -------------------------
export function getAccessTokenPayload(): AccessTokenPayloadDTO | undefined {
  const token = accessTokenRepository.get();
  if (!token) return undefined;

  try {
    const raw = jwtDecode<RawClaims>(token);

    const payload: AccessTokenPayloadDTO = {
      user_name: raw.user_name ?? raw.userName ?? raw.sub ?? "",
      // Prioriza 'authorities', mas se não existir, usa 'scope'
      // O backend está enviando roles no campo 'scope'
      authorities: normalizeAuthorities(raw.authorities || raw.scope),
      exp: Number(raw.exp) || 0,
      userId: Number(raw.userId),
      // opcionais, se vierem no token
      userEmail: raw.userEmail || raw.email,
      userName: raw.userName ?? raw.user_name ?? raw.name,
    };

    return payload;
  } catch {
    return undefined;
  }
}

// -------------------------
// Regras de sessão / roles
// -------------------------
export function isAuthenticated(): boolean {
  const payload = getAccessTokenPayload();
  return payload !== undefined && (!payload.exp || payload.exp * 1000 > Date.now());
}

export function hasRole(role: RoleEnum): boolean {
  const payload = getAccessTokenPayload();
  return !!payload?.authorities?.includes(role);
}

// Função hasAnyRoles
export function hasAnyRoles(roles: RoleEnum[]): boolean {
  if (!roles || roles.length === 0) return true;

  const payload = getAccessTokenPayload();
  if (!payload) return false;

  return roles.some((role) => payload.authorities?.includes(role));
}

// -------------------------
// Endpoints públicos
// -------------------------
export function isPublicEndpoint(url: string, method: string): boolean {
  // Verifica endpoints específicos de auth que são sempre públicos
  if (PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint))) {
    return true;
  }
  
  // Para métodos GET, verifica se está na lista de endpoints GET públicos específicos
  if (method === 'GET') {
    const cleanUrl = url.split('?')[0].replace(/\/$/, ''); // remove query e barra final

    // Verifica endpoints dinâmicos públicos com regex
    // Ex: /goatfarms/1/goats ou /goatfarms/1
    const publicRegexPatterns = [
      /^\/goatfarms\/\d+\/goats$/,
      /^\/goatfarms\/\d+$/,
      /^\/goatfarms\/\d+\/goats\/search$/
    ];

    if (publicRegexPatterns.some(pattern => pattern.test(cleanUrl))) {
      return true;
    }

    // Match estrito: apenas o endpoint raiz é público
    return PUBLIC_GET_ENDPOINTS.some((endpoint) => {
      const cleanEndpoint = endpoint.replace(/\/$/, '');
      return cleanUrl === cleanEndpoint; // apenas igual ao raiz
    });
  }
  
  // Todos os outros métodos (POST, PUT, DELETE, etc.) são protegidos por padrão
  return false;
}

// Retorna headers de auth apenas para endpoints protegidos
export function getAuthHeaders(url: string = '', method: string = 'GET'): Record<string, string> {
  if (isPublicEndpoint(url, method)) {
    return {}; // Sem token para endpoints públicos
  }
  
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// -------------------------
// Usuário atual
// -------------------------
export interface CurrentUser {
  id: number;
  username: string;
  email?: string;
  roles: string[];
}

export function getCurrentUser(): CurrentUser | null {
  const payload = getAccessTokenPayload();
  if (!payload) return null;

  return {
    id: payload.userId,
    username: payload.user_name,
    email: payload.userEmail,
    roles: payload.authorities,
  };
}

// -------------------------
// User Data
// -------------------------
export async function getCurrentUserData(): Promise<unknown> {
  const config: AxiosRequestConfig = {
    method: "GET",
    url: "/auth/me",
  };

  try {
    const response = await requestBackEnd(config);
    return response.data;
  } catch (error: unknown) {
    console.error('Falha ao obter dados do usuário:', error);
    throw new Error('Falha ao obter dados do usuário');
  }
}

// -------------------------
// Refresh Token
// -------------------------
export async function refreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error('🔍 DEBUG: Refresh token não encontrado no localStorage');
    throw new Error('No refresh token available');
  }

  console.log('🔍 DEBUG: Tentando renovar token com refreshToken:', refreshToken.substring(0, 20) + '...');

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    refreshToken: refreshToken,
  };

  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/auth/refresh",
    data,
    headers,
  };

  try {
    const response = await requestBackEnd(config);
    console.log('🔍 DEBUG: Resposta do refresh token:', response.data);
    
    // Suporte para diferentes formatos de resposta do backend
    const newAccessToken = response.data.accessToken || response.data.access_token;
    const newRefreshToken = response.data.refreshToken || response.data.refresh_token;
    
    if (newAccessToken) {
      console.log('🔍 DEBUG: Salvando novo accessToken:', newAccessToken.substring(0, 20) + '...');
      saveAccessToken(newAccessToken);
    } else {
      console.error('⚠️ ERROR: Nenhum access token na resposta do refresh');
      throw new Error('No access token in refresh response');
    }
    
    if (newRefreshToken) {
      console.log('🔍 DEBUG: Salvando novo refreshToken:', newRefreshToken.substring(0, 20) + '...');
      localStorage.setItem('refresh_token', newRefreshToken);
    }
  } catch (error) {
    console.error('🔍 DEBUG: Erro ao renovar token:', error);
    logOut();
    throw new Error('Falha ao renovar token');
  }
}
