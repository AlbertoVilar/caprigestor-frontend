export type ParsedApiError = {
  status?: number;
  message?: string;
  details?: unknown;
};

export const parseApiError = (error: unknown): ParsedApiError => {
  const err = error as {
    message?: string;
    response?: { status?: number; data?: { message?: string; error?: string; details?: unknown } };
  };

  return {
    status: err?.response?.status,
    message: err?.response?.data?.message || err?.response?.data?.error || err?.message,
    details: err?.response?.data?.details,
  };
};

export const getApiErrorMessage = (parsed: ParsedApiError): string => {
  const message = parsed.message?.trim();
  switch (parsed.status) {
    case 422:
      return `Regra de negócio/validação: ${message || "dados inválidos."}`;
    case 409:
      return `Conflito: ${message || "dados já existentes."}`;
    case 403:
      return "Sem permissão para esta fazenda.";
    case 404:
      return "Recurso não encontrado.";
    default:
      return message || "Erro inesperado. Tente novamente.";
  }
};
