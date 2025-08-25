// src/services/auth-service.ts
import qs from "qs";
import { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";

import { CredentialsDTO, AccessTokenPayloadDTO, RoleEnum } from "../Models/auth";
import { requestBackEnd } from "../utils/request";
import * as accessTokenRepository from "../localstorage/access-token-repository";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "defaultClientId";
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET || "defaultClientSecret";

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

export function hasAnyRoles(roles: RoleEnum[]): boolean {
  if (!roles || roles.length === 0) return true;

  const payload = getAccessTokenPayload();
  if (!payload) return false;

  return roles.some((role) => payload.authorities?.includes(role));
}
