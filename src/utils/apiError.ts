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
      return `Verifique os dados: ${message || "campos inválidos ou incompletos."}`;
    case 409:
      return `Ação bloqueada: ${message || "conflito de dados (já existe?)."}`;
    case 403:
      return "Acesso negado. Apenas proprietário ou admin podem realizar esta ação.";
    case 404:
      return "Recurso não encontrado. Tente atualizar a página.";
    default:
      return message || "Erro inesperado. Tente novamente.";
  }
};
