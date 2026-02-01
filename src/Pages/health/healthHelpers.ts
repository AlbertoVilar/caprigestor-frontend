import axios from "axios";
import { ApiValidationError } from "../../types/api";

const collectValidationMessages = (data: ApiValidationError) => {
  if (!data.errors || data.errors.length === 0) return "";
  return data.errors.map((error) => error.message).join(" • ");
};

export const isUnauthorizedError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 401;
};

export const isForbiddenError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 403;
};

export const getFriendlyErrorMessage = (
  error: unknown,
  fallback = "Erro ao processar a requisição"
): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiValidationError | undefined;
    if (responseData) {
      const validationMessage = collectValidationMessages(responseData);
      if (validationMessage) return validationMessage;
      if (responseData.message) return responseData.message;
    }

    const genericResponseMessage = (error.response?.data as { message?: string })?.message;
    if (genericResponseMessage) return genericResponseMessage;
  }

  return fallback;
};
