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

/**
 * Normalizes the performedAt date to ensure it is not in the future.
 * 
 * If inputDate > now, returns now.
 * 
 * @param inputDate The date selected by the user
 * @param now The current date (defaults to new Date()) - injected for testing
 */
export const normalizePerformedAt = (inputDate: Date, now: Date = new Date()): Date => {
  // Clamp to client "now" if future
  if (inputDate.getTime() > now.getTime()) {
    return now;
  }
  return inputDate;
};

/**
 * Formats a Date object to a Local DateTime string (yyyy-MM-dd'T'HH:mm:ss)
 * without timezone information (Z) and without offset.
 * 
 * This is crucial for backends expecting LocalDateTime (no timezone)
 * to avoid "future date" errors caused by UTC shifting.
 * 
 * @param date The date to format
 * @returns string formatted as "yyyy-MM-ddTHH:mm:ss"
 */
export const formatLocalDateTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Legacy helper kept for compatibility if needed, but redirects to formatLocalDateTime
 * for this specific use case, or we can deprecate it.
 * 
 * Ideally, we should switch to formatLocalDateTime.
 */
export const toSafeISOString = (date: Date): string => {
  return formatLocalDateTime(date);
};
