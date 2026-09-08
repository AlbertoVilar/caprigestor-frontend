import { AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiError, ValidationError } from "../types/api";
import { requestBackEnd } from "../utils/request";

type BackendErrorPayload = {
  message?: string;
  error?: string;
  code?: string;
  status?: number;
  timestamp?: string;
  path?: string;
  errors?: Array<{ fieldName?: string; field?: string; message?: string }>;
};

const toValidationErrors = (values: BackendErrorPayload["errors"]): ValidationError[] | undefined => {
  if (!Array.isArray(values) || values.length === 0) return undefined;
  return values.map((entry) => ({
    fieldName: entry.fieldName ?? entry.field,
    message: entry.message ?? "Valor inválido",
  }));
};

function normalizeError(error: unknown): ApiError {
  const candidate = error as {
    response?: { status?: number; data?: BackendErrorPayload };
    message?: string;
    code?: string;
    config?: { url?: string };
  };
  const payload = candidate.response?.data ?? {};
  return {
    message: payload.message || payload.error || candidate.message || "Ocorreu um erro na comunicação com o servidor.",
    code: payload.code || payload.error || candidate.code || "UNKNOWN_ERROR",
    timestamp: payload.timestamp || new Date().toISOString(),
    path: payload.path || candidate.config?.url || "",
    status: candidate.response?.status,
    error: payload.error,
    errors: toValidationErrors(payload.errors),
  };
}

/** Compatibility facade over the single authenticated request client. */
class ApiClient {
  private async call<T>(request: Promise<AxiosResponse<T>>): Promise<AxiosResponse<T>> {
    try {
      return await request;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.call(requestBackEnd.get<T>(url, config));
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.call(requestBackEnd.post<T>(url, data, config));
  }

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.call(requestBackEnd.put<T>(url, data, config));
  }

  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.call(requestBackEnd.patch<T>(url, data, config));
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.call(requestBackEnd.delete<T>(url, config));
  }
}

export const apiClient = new ApiClient();
