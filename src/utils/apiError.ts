export type ParsedApiError = {
  status?: number;
  message?: string;
  error?: string;
  path?: string;
  details?: unknown;
  fieldErrors?: Array<{ fieldName?: string; message: string }>;
};

type RawFieldError = {
  fieldName?: string;
  field?: string;
  message?: string;
};

const collectFieldErrors = (
  values: RawFieldError[] | undefined
): ParsedApiError["fieldErrors"] => {
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }

  return values
    .filter((entry) => Boolean(entry?.message))
    .map((entry) => ({
      fieldName: entry.fieldName ?? entry.field,
      message: entry.message ?? "Valor invalido",
    }));
};

export const parseApiError = (error: unknown): ParsedApiError => {
  const err = error as {
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: string;
        error?: string;
        path?: string;
        details?: unknown;
        errors?: RawFieldError[];
      };
    };
  };

  const responseData = err?.response?.data;
  const fieldErrors = collectFieldErrors(responseData?.errors);

  return {
    status: err?.response?.status,
    message: responseData?.message || responseData?.error || err?.message,
    error: responseData?.error,
    path: responseData?.path,
    details: responseData?.details,
    fieldErrors,
  };
};

const buildFieldErrorMessage = (parsed: ParsedApiError): string | undefined => {
  if (!parsed.fieldErrors || parsed.fieldErrors.length === 0) return undefined;
  return parsed.fieldErrors.map((entry) => entry.message).join(" ");
};

export const getApiErrorMessage = (parsed: ParsedApiError): string => {
  const message = parsed.message?.trim();
  const fieldErrors = buildFieldErrorMessage(parsed);

  switch (parsed.status) {
    case 400:
      return message || fieldErrors || "Requisicao invalida. Revise os dados enviados.";
    case 404:
      return message || "Recurso nao encontrado. Atualize a pagina e tente novamente.";
    case 409:
      return message || "Conflito de dados. Pode existir registro duplicado.";
    case 422:
      return fieldErrors || message || "Regra de negocio violada. Revise os campos.";
    case 403:
      return "Acesso negado. Apenas proprietario ou admin podem realizar esta acao.";
    default:
      return message || "Erro inesperado. Tente novamente.";
  }
};
