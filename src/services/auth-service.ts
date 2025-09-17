// src/services/auth-service.ts
import qs from "qs";
import { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";

import { CredentialsDTO, AccessTokenPayloadDTO, RoleEnum } from "../Models/auth";
import { requestBackEnd } from "../utils/request";
import * as accessTokenRepository from "../localstorage/access-token-repository";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "defaultClientId";
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET || "defaultClientSecret";

// Lista de endpoints públicos que não precisam de autenticação
const PUBLIC_ENDPOINTS = [
  '/oauth2/token',
  '/oauth/token', 
  '/auth/login',
  '/auth/refresh',
  '/auth/register-farm',
  '/genealogies',
];

// Lista de endpoints GET que são públicos (sem autenticação)
const PUBLIC_GET_ENDPOINTS = [
  '/genealogies',
  '/goatfarms', // Listagem de fazendas é pública
  '/goats', // Listagem de cabras é pública
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
    const accessToken = response.data.access_token || response.data.accessToken;
    const refreshToken = response.data.refresh_token || response.data.refreshToken;
    
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
    return PUBLIC_GET_ENDPOINTS.some(endpoint => url.includes(endpoint));
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
export async function getCurrentUserData(): Promise<any> {
  const config: AxiosRequestConfig = {
    method: "GET",
    url: "/auth/me",
  };

  try {
    const response = await requestBackEnd(config);
    return response.data;
  } catch (error) {
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
    const newAccessToken = response.data.access_token || response.data.accessToken;
    const newRefreshToken = response.data.refresh_token || response.data.refreshToken;
    
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
