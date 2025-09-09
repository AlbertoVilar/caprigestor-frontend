// src/services/auth-service.ts
import qs from "qs";
import axios, { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";

import { CredentialsDTO, AccessTokenPayloadDTO, RoleEnum } from "../Models/auth";
import { requestBackEnd } from "../utils/request";
import * as accessTokenRepository from "../localstorage/access-token-repository";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "defaultClientId";
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET || "defaultClientSecret";

// Interface limpa para registro de usuário - compatível com backend
interface UserRegistrationData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
  roles: string[];
}

// Interface para dados do formulário frontend
interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
}

// Tipos para resposta da API
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

interface RegistrationResponse {
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    username: string;
  };
  message?: string;
}

// Tipos para erros da API
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Enum para códigos de erro comuns
enum ErrorCodes {
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_DATA = 'INVALID_DATA',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Ajuste a URL conforme seu backend:
 * - Spring Authorization Server moderno: "/oauth2/token"
 * - Stack antiga do Spring Security OAuth: "/oauth/token"
 */
export function loginRequest(loginData: CredentialsDTO) {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + window.btoa(CLIENT_ID + ":" + CLIENT_SECRET),
  };

  const data = qs.stringify({
    ...loginData,
    grant_type: "password",
  });

  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/oauth2/token", // <-- troque para "/oauth/token" se for o seu caso
    data,
    headers,
  };

  return requestBackEnd(config);
}

/**
 * Registra um novo usuário no sistema
 * @param formData - Dados do formulário de cadastro
 * @returns Promise com a resposta tipada da API
 * @throws ApiError com detalhes específicos do erro
 */
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
      baseURL: 'http://localhost:8080',
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

  } catch (error: any) {
    console.log('❌ ERRO CAPTURADO NO SERVIÇO:');
    console.log('Tipo do erro:', typeof error);
    console.log('Erro completo:', error);
    
    if (error.response) {
      console.log('📊 DETALHES DO ERRO HTTP:');
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      console.log('Headers:', error.response.headers);
      console.log('Config URL:', error.config?.url);
      console.log('Config Method:', error.config?.method);
      console.log('Config Data:', error.config?.data);
    }
    
    return handleRegistrationError(error);
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
function handleRegistrationError(error: any): ApiError {
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
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return createApiError(
      'Tempo limite excedido. Verifique sua conexão.',
      0,
      ErrorCodes.NETWORK_ERROR
    );
  }

  // Erro genérico
  return createApiError(
    error.message || 'Erro inesperado. Tente novamente.',
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
function createApiError(message: string, status?: number, code?: ErrorCodes, details?: any): ApiError {
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
}

// -------------------------
// Tipos seguros para o decode
// -------------------------
type RawClaims = Partial<{
  user_name: string;
  userName: string;
  sub: string;
  authorities: string[] | string;
  exp: number | string;
  userId: number | string;
  userEmail: string;
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
      authorities: normalizeAuthorities(raw.authorities),
      exp: Number(raw.exp) || 0,
      userId: Number(raw.userId),
      // opcionais, se vierem no token
      userEmail: raw.userEmail,
      userName: raw.userName ?? raw.user_name,
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