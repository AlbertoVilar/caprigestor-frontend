import axios, { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";

import { CredentialsDTO, AccessTokenPayloadDTO, RoleEnum } from "../Models/auth";
import * as accessTokenRepository from "../localstorage/access-token-repository";
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearAuthenticationStorage,
  getRefreshToken,
  isPublicEndpoint,
  REFRESH_TOKEN_STORAGE_KEY,
  saveRefreshToken,
} from "../utils/auth-contract";
import { refreshAccessToken, requestBackEnd } from "../utils/request";

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
}

export interface RegistrationResponse {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  roles?: string[];
  createdAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface PasswordResetRequestData { email: string }
interface PasswordResetConfirmData { token: string; newPassword: string; confirmPassword: string }

enum ErrorCodes {
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  INVALID_DATA = "INVALID_DATA",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
}

interface ApiError {
  message: string;
  status?: number;
  code?: ErrorCodes;
  details?: unknown;
}

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
};

function extractTokenPair(body: LoginResponse): { accessToken?: string; refreshToken?: string } {
  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  };
}

export async function loginRequest(loginData: CredentialsDTO) {
  const response = await requestBackEnd.post<LoginResponse>("/auth/login", loginData, {
    headers: { "Content-Type": "application/json" },
  });
  const { accessToken, refreshToken } = extractTokenPair(response.data ?? {});
  if (!accessToken || !refreshToken) {
    throw new Error("Login response did not contain the authentication token pair");
  }

  saveAccessToken(accessToken);
  saveRefreshToken(refreshToken);
  return response;
}

export function requestPasswordReset(data: PasswordResetRequestData) {
  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/auth/password-reset/request",
    data,
    headers: { "Content-Type": "application/json" },
  };
  return requestBackEnd(config);
}

export function confirmPasswordReset(data: PasswordResetConfirmData) {
  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/auth/password-reset/confirm",
    data,
    headers: { "Content-Type": "application/json" },
  };
  return requestBackEnd(config);
}

/** Public self-registration. Administrative /users endpoints are never used here. */
export async function registerUser(formData: UserFormData): Promise<ApiResponse<RegistrationResponse>> {
  try {
    validateFormData(formData);
    const response = await requestBackEnd.post<RegistrationResponse>("/auth/register", {
      name: formData.name.trim(),
      email: formData.email.trim(),
      cpf: formData.cpf.replace(/\D/g, ""),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    }, { headers: { "Content-Type": "application/json" } });

    return {
      data: response.data,
      status: response.status,
      message: "Usuário registrado com sucesso",
    };
  } catch (error: unknown) {
    throw handleRegistrationError(error);
  }
}

function validateFormData(formData: UserFormData): void {
  if (!formData.name?.trim()) throw createApiError("Nome é obrigatório", 400, ErrorCodes.VALIDATION_ERROR);
  if (!formData.email?.trim()) throw createApiError("Email é obrigatório", 400, ErrorCodes.VALIDATION_ERROR);
  if (!formData.password) throw createApiError("Senha é obrigatória", 400, ErrorCodes.VALIDATION_ERROR);
  if (formData.password !== formData.confirmPassword) {
    throw createApiError("As senhas não coincidem", 400, ErrorCodes.VALIDATION_ERROR);
  }
  if (!formData.cpf?.trim()) throw createApiError("CPF é obrigatório", 400, ErrorCodes.VALIDATION_ERROR);
}

function handleRegistrationError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string } | undefined;
    const message = data?.message;
    if (status === 409) return createApiError(message ?? "E-mail ou CPF já está em uso.", status, ErrorCodes.EMAIL_ALREADY_EXISTS);
    if (status === 400 || status === 422) return createApiError(message ?? "Dados inválidos. Verifique as informações.", status, ErrorCodes.INVALID_DATA);
    if (status && status >= 500) return createApiError("Erro interno do servidor. Tente novamente mais tarde.", status, ErrorCodes.SERVER_ERROR);
    return createApiError(message ?? "Erro de comunicação com o servidor.", status ?? 0, ErrorCodes.NETWORK_ERROR);
  }
  if (error && typeof error === "object" && "message" in error) {
    return createApiError(String((error as { message: unknown }).message), 0, ErrorCodes.SERVER_ERROR);
  }
  return createApiError("Erro inesperado. Tente novamente.", 0, ErrorCodes.SERVER_ERROR);
}

function createApiError(message: string, status?: number, code?: ErrorCodes, details?: unknown): ApiError {
  return { message, status, code, details };
}

export function saveAccessToken(token: string): void { accessTokenRepository.save(token); }
export function getAccessToken(): string | null { return accessTokenRepository.get(); }

/** Revokes the refresh-token family when the backend session is available, then clears local state. */
export function logOut(): void {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    void Promise.resolve(requestBackEnd.post("/auth/logout", { refreshToken })).catch(() => undefined);
  }
  clearAuthenticationStorage();
}

type RawClaims = Partial<{
  user_name: string; userName: string; sub: string;
  authorities: string[] | string; scope: string;
  exp: number | string; userId: number | string;
  userEmail: string; email: string; name: string;
}> & Record<string, unknown>;

function normalizeAuthorities(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string") return input.split(/[,\s]+/).filter(Boolean);
  return [];
}

export function getAccessTokenPayload(): AccessTokenPayloadDTO | undefined {
  const token = accessTokenRepository.get();
  if (!token) return undefined;
  try {
    const raw = jwtDecode<RawClaims>(token);
    return {
      user_name: raw.user_name ?? raw.userName ?? raw.sub ?? "",
      authorities: normalizeAuthorities(raw.authorities ?? raw.scope),
      exp: Number(raw.exp) || 0,
      userId: Number(raw.userId),
      userEmail: raw.userEmail ?? raw.email,
      userName: raw.userName ?? raw.user_name ?? raw.name,
    };
  } catch {
    return undefined;
  }
}

export function isAuthenticated(): boolean {
  const payload = getAccessTokenPayload();
  return payload !== undefined && (!payload.exp || payload.exp * 1000 > Date.now());
}

export function hasRole(role: RoleEnum): boolean {
  return getAccessTokenPayload()?.authorities?.includes(role) ?? false;
}

export function hasAnyRoles(roles: RoleEnum[]): boolean {
  if (!roles?.length) return true;
  const authorities = getAccessTokenPayload()?.authorities ?? [];
  return roles.some((role) => authorities.includes(role));
}

export function getAuthHeaders(url = "", method = "GET"): Record<string, string> {
  if (isPublicEndpoint(url, method)) return {};
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CurrentUser { id: number; username: string; email?: string; roles: string[] }
export function getCurrentUser(): CurrentUser | null {
  const payload = getAccessTokenPayload();
  return payload ? { id: payload.userId, username: payload.user_name, email: payload.userEmail, roles: payload.authorities } : null;
}

export async function getCurrentUserData(): Promise<unknown> {
  try {
    const response = await requestBackEnd.get("/auth/me");
    return response.data;
  } catch {
    throw new Error("Falha ao obter dados do usuário");
  }
}

/** Explicit/manual refresh entry point delegates to the same rotation implementation as the interceptor. */
export async function refreshToken(): Promise<void> {
  try {
    await refreshAccessToken();
  } catch {
    clearAuthenticationStorage();
    throw new Error("Falha ao renovar token");
  }
}

export { ACCESS_TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY, isPublicEndpoint };
