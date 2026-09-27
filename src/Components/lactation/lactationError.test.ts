import { describe, expect, it } from "vitest";
import { parseApiError } from "../../utils/apiError";
import { getLactationErrorMessage } from "./lactationError";

const asAxiosLikeError = (status: number, data: Record<string, unknown>) => ({
  response: {
    status,
    data,
  },
});

describe("getLactationErrorMessage", () => {
  it("shows the canonical ownership reason instead of a credential denial", () => {
    const parsed = parseApiError(
      asAxiosLikeError(403, {
        error: "Acesso negado",
        errors: [
          {
            fieldName: "auth",
            message: "A fazenda não possui ownership canônico inequívoco durante todo o dia informado.",
          },
        ],
      })
    );

    expect(getLactationErrorMessage(parsed)).toBe(
      "Não é possível realizar esta operação nessa data porque a fazenda não possui ownership canônico inequívoco durante todo o dia informado."
    );
    expect(getLactationErrorMessage(parsed)).not.toContain("Apenas proprietário ou admin");
  });

  it("preserves the generic authorization fallback for other 403 responses", () => {
    const parsed = parseApiError(
      asAxiosLikeError(403, {
        error: "Acesso negado",
        errors: [{ fieldName: "auth", message: "Usuário sem permissão para esta operação." }],
      })
    );

    expect(getLactationErrorMessage(parsed)).toBe(
      "Acesso negado. Apenas proprietário ou admin podem realizar esta ação."
    );
  });

  it.each([409, 422, 500])("preserves existing handling for HTTP %s", (status) => {
    const parsed = parseApiError(
      asAxiosLikeError(status, { error: "Erro existente", message: "Detalhe da operação" })
    );

    expect(getLactationErrorMessage(parsed)).toBe("Detalhe da operação");
  });
});
