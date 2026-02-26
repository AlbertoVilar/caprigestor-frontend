import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiError, ValidationError } from "../types/api";
import { resolveApiBaseUrl } from "../utils/apiConfig";

type BackendErrorPayload = {
  message?: string;
  error?: string;
  code?: string;
  status?: number;
  timestamp?: string;
  path?: string;
  errors?: Array<{ fieldName?: string; field?: string; message?: string }>;
};

const toValidationErrors = (
  values: BackendErrorPayload["errors"]
): ValidationError[] | undefined => {
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }

  return values.map((entry) => ({
    fieldName: entry.fieldName ?? entry.field,
    message: entry.message ?? "Valor invalido",
  }));
};

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    const baseURL = resolveApiBaseUrl();

    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (import.meta.env.VITE_DEV_MODE === "true") {
      console.log("[ApiClient] baseURL:", baseURL);
    }

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const response = await this.instance.post("/auth/refresh", {
                refreshToken,
              });

              const { token, accessToken, access_token } = response.data ?? {};
              const nextToken = token || accessToken || access_token;

              if (!nextToken) {
                throw new Error("No access token in refresh response");
              }

              localStorage.setItem("authToken", nextToken);
              originalRequest.headers.Authorization = `Bearer ${nextToken}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        const payload = (error.response?.data ?? {}) as BackendErrorPayload;
        const apiError: ApiError = {
          message: payload.message || payload.error || error.message || "An error occurred",
          code: payload.code || payload.error || error.code || "UNKNOWN_ERROR",
          timestamp: payload.timestamp || new Date().toISOString(),
          path: payload.path || error.config?.url || "",
          status: error.response?.status,
          error: payload.error,
          errors: toValidationErrors(payload.errors),
        };

        return Promise.reject(apiError);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
