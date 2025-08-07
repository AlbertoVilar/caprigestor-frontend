import qs from "qs";
import { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";

import { CredentialsDTO, AccessTokenPayloadDTO, RoleEnum } from "../Models/auth";
import { requestBackEnd } from "../utils/request";
import * as accessTokenRepository from "../localstorage/access-token-repository";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "defaultClientId";
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET || "defaultClientSecret";


// Envia a requisição de login (grant_type password)
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
    url: "/oauth2/token",
    data,
    headers,
  };

  return requestBackEnd(config);
}

// Salva o token
export function saveAccessToken(token: string) {
  accessTokenRepository.save(token);
}

// Retorna o payload decodificado
export function getAccessTokenPayload(): AccessTokenPayloadDTO | undefined {
  const token = accessTokenRepository.get();
  try {
    return token ? jwtDecode(token) : undefined;
  } catch {
    return undefined;
  }
}

// Verifica se há token válido
export function isAuthenticated(): boolean {
  const payload = getAccessTokenPayload();
  return payload !== undefined && payload.exp * 1000 > Date.now();
}

// Verifica se o usuário tem pelo menos uma das roles
export function hasAnyRoles(roles: RoleEnum[]): boolean {
  if (!roles || roles.length === 0) return true;

  const payload = getAccessTokenPayload();
  if (!payload) return false;

  return roles.some(role => payload.authorities?.includes(role));
}

// Remove token do localStorage
export function logOut() {
  accessTokenRepository.remove();
}
