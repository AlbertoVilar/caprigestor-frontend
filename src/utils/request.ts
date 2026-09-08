import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "react-toastify";
import * as accessTokenRepository from "../localstorage/access-token-repository";
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearAuthenticationStorage,
  getRefreshToken,
  isPublicEndpoint,
  saveRefreshToken,
} from "./auth-contract";
import { resolveApiBaseUrl } from "./apiConfig";

type RequestWithRetryFlags = InternalAxiosRequestConfig & { _retry?: boolean };

const getBaseURL = () => resolveApiBaseUrl();

export const requestBackEnd = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
};

function isPublic(config: { url?: string; method?: string }): boolean {
  return isPublicEndpoint(config.url ?? "", (config.method ?? "GET").toUpperCase());
}

/** Performs the only refresh flow used by the frontend, with atomic token replacement. */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  const response = await axios.post(`${getBaseURL()}/auth/refresh`, { refreshToken }, {
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  });
  const body = response.data ?? {};
  const nextAccessToken = body.accessToken;
  const nextRefreshToken = body.refreshToken;

  if (typeof nextAccessToken !== "string" || nextAccessToken.length === 0) {
    throw new Error("No access token in refresh response");
  }
  if (typeof nextRefreshToken !== "string" || nextRefreshToken.length === 0) {
    throw new Error("No refresh token in refresh response");
  }

  // Persist the complete rotated pair together; never leave a stale refresh token.
  accessTokenRepository.save(nextAccessToken);
  saveRefreshToken(nextRefreshToken);
  return nextAccessToken;
}

requestBackEnd.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!isPublic(config)) {
      const token = accessTokenRepository.get();
      if (token) {
        const headers = new AxiosHeaders(config.headers);
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

requestBackEnd.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config ?? {}) as RequestWithRetryFlags;

    if (error.response?.status === 401 && !originalRequest._retry && !isPublic(originalRequest)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(() => requestBackEnd(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const token = await refreshAccessToken();
        processQueue(null, token);
        return requestBackEnd(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthenticationStorage();
        if (!toast.isActive("session-expired")) {
          toast.error("Sessão expirada. Faça login novamente.", { toastId: "session-expired" });
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      toast.error("Você não tem permissão para realizar esta ação.");
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error("Erro interno do servidor. Tente novamente mais tarde.");
    } else if (!error.response && !toast.isActive("backend-offline")) {
      toast.error("Erro de conexão com o servidor. Verifique sua conexão.", {
        autoClose: 8000,
        toastId: "backend-offline",
      });
    }

    return Promise.reject(error);
  }
);

export const makeRequest = async <T = unknown>(config: AxiosRequestConfig): Promise<T> =>
  (await requestBackEnd(config)).data;

export const get = async <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  makeRequest<T>({ ...config, method: "GET", url });

export const post = async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  makeRequest<T>({ ...config, method: "POST", url, data });

export const put = async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  makeRequest<T>({ ...config, method: "PUT", url, data });

export const del = async <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  makeRequest<T>({ ...config, method: "DELETE", url });

export const patch = async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  makeRequest<T>({ ...config, method: "PATCH", url, data });

export { ACCESS_TOKEN_STORAGE_KEY, isPublicEndpoint };
export default requestBackEnd;
