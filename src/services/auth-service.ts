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
    // Salva o access token
    if (response.data.access_token) {
      saveAccessToken(response.data.access_token);
    }
    
    // Salva o refresh token se disponível
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
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
  // Todos os endpoints GET são públicos (visualização do catálogo)
  if (method === 'GET') {
    return true;
  }
  
  // Endpoints específicos de auth são públicos
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
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
    throw new Error('Refresh token não encontrado');
  }

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
    saveAccessToken(response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
  } catch (error) {
    logOut();
    throw new Error('Falha ao renovar token');
  }
}
