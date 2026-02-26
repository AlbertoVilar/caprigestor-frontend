import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "react-toastify";
import { getAuthHeaders, isPublicEndpoint } from "../services/auth-service";
import { isPublicEndpoint as permissionIsPublic } from "../services/PermissionService";
import {
  API_PREFIX,
  isDeprecatedApiFallbackEnabled,
  resolveApiBaseUrl,
  resolveLegacyApiBaseUrl,
} from "./apiConfig";

type RequestWithRetryFlags = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _legacyRetry?: boolean;
};

const getBaseURL = () => resolveApiBaseUrl();
const getDeprecatedLegacyBaseURL = () => resolveLegacyApiBaseUrl();
const getRefreshUrl = () => `${getBaseURL()}/auth/refresh`;

const shouldUseLegacyFallback = (
  error: AxiosError,
  originalRequest: RequestWithRetryFlags
): boolean => {
  if (!isDeprecatedApiFallbackEnabled()) return false;
  if (originalRequest._legacyRetry) return false;
  if (error.response?.status !== 404) return false;

  const baseURL = `${originalRequest.baseURL ?? getBaseURL()}`;
  return baseURL.includes(API_PREFIX);
};

const withLegacyBaseURL = (
  originalRequest: RequestWithRetryFlags
): RequestWithRetryFlags => ({
  ...originalRequest,
  baseURL: getDeprecatedLegacyBaseURL(),
  _legacyRetry: true,
});

export const requestBackEnd = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

requestBackEnd.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url || "";
    const method = config.method?.toUpperCase() || "GET";

    const isPublicAuth = isPublicEndpoint(url, method);
    const isPublicPermission = permissionIsPublic(url, method);
    const isPublic = isPublicAuth || isPublicPermission;

    if (import.meta.env.DEV) {
      console.log(`[RequestBackend] ${method} ${url} - Public: ${isPublic}`);
    }

    if (!isPublic) {
      const authHeaders = getAuthHeaders(url, method);
      const mergedHeaders = new AxiosHeaders(config.headers);
      Object.entries(authHeaders).forEach(([key, value]) => {
        if (value) mergedHeaders.set(key, value);
      });
      config.headers = mergedHeaders;

      if (import.meta.env.DEV && authHeaders.Authorization) {
        console.log("[RequestBackend] Token adicionado");
      }
    }

    return config;
  },
  (error) => {
    console.error("[RequestBackend] Erro na requisicao:", error);
    return Promise.reject(error);
  }
);

requestBackEnd.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config ?? {}) as RequestWithRetryFlags;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || "";
      const method = originalRequest.method?.toUpperCase() || "GET";

      const isPublicAuth = isPublicEndpoint(url, method);
      const isPublicPermission = permissionIsPublic(url, method);
      const isPublic = isPublicAuth || isPublicPermission;

      if (isPublic) {
        console.log(`[RequestBackend] Erro 401 em endpoint publico: ${method} ${url}`);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => requestBackEnd(originalRequest))
          .catch((refreshError) => Promise.reject(refreshError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          const response = await axios.post(getRefreshUrl(), {
            refreshToken,
          });

          const { accessToken, access_token, refreshToken: nextRefreshToken, refresh_token } =
            response.data ?? {};

          const nextAccessToken = accessToken || access_token;
          const nextRefresh = nextRefreshToken || refresh_token;

          if (!nextAccessToken) {
            throw new Error("No access token in refresh response");
          }

          localStorage.setItem("authToken", nextAccessToken);
          if (nextRefresh) {
            localStorage.setItem("refresh_token", nextRefresh);
          }

          processQueue(null, nextAccessToken);
          return requestBackEnd(originalRequest);
        }

        throw new Error("No refresh token available");
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("refresh_token");
        toast.error("Sessao expirada. Faca login novamente.");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (shouldUseLegacyFallback(error, originalRequest)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[RequestBackend][DEPRECATED] Fallback legado ativo para ${originalRequest.method?.toUpperCase() || "GET"} ${originalRequest.url}`
        );
      }
      return requestBackEnd(withLegacyBaseURL(originalRequest));
    }

    if (error.response?.status === 403) {
      toast.error("Voce nao tem permissao para realizar esta acao.");
      console.log("[RequestBackend] Erro 403 detectado");
    }

    if (error.response?.status && error.response.status >= 500) {
      toast.error("Erro interno do servidor. Tente novamente mais tarde.");
    }

    if (!error.response) {
      const devMode = import.meta.env.VITE_DEV_MODE === "true";
      const baseURL = getBaseURL();

      console.error("[RequestBackend] Erro de rede - servidor indisponivel");

      if (devMode) {
        if (!toast.isActive("backend-offline")) {
          toast.error(
            `MODO DESENVOLVIMENTO: Backend nao esta rodando em ${baseURL}. ` +
              "Inicie o backend ou configure VITE_API_BASE_URL no arquivo .env",
            { autoClose: 8000, toastId: "backend-offline" }
          );
        }
      } else if (!toast.isActive("backend-offline")) {
        toast.error("Erro de conexao com o servidor. Verifique sua conexao.", {
          autoClose: 8000,
          toastId: "backend-offline",
        });
      }
    }

    if (import.meta.env.DEV) {
      console.error("[RequestBackend] Erro na resposta:", error);
    }

    return Promise.reject(error);
  }
);

export const makeRequest = async <T = unknown>(config: AxiosRequestConfig): Promise<T> => {
  const response = await requestBackEnd(config);
  return response.data;
};

export const get = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return makeRequest<T>({ ...config, method: "GET", url });
};

export const post = <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return makeRequest<T>({ ...config, method: "POST", url, data });
};

export const put = <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return makeRequest<T>({ ...config, method: "PUT", url, data });
};

export const del = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return makeRequest<T>({ ...config, method: "DELETE", url });
};

export const patch = <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return makeRequest<T>({ ...config, method: "PATCH", url, data });
};

export default requestBackEnd;
