import { describe, expect, it } from "vitest";
import { getApiErrorMessage, parseApiError } from "./apiError";

const asAxiosLikeError = (status: number, data: Record<string, unknown>) => ({
  response: {
    status,
    data,
  },
});

describe("apiError", () => {
  it("parses backend validation payload and maps 422 message", () => {
    const parsed = parseApiError(
      asAxiosLikeError(422, {
        error: "Regra de negocio violada",
        errors: [{ fieldName: "quantity", message: "Saldo insuficiente" }],
      })
    );

    expect(parsed.status).toBe(422);
    expect(parsed.fieldErrors).toEqual([{ fieldName: "quantity", message: "Saldo insuficiente" }]);
    expect(getApiErrorMessage(parsed)).toBe("Saldo insuficiente");
  });

  it("maps required status messages for migration contract", () => {
    expect(
      getApiErrorMessage(
        parseApiError(asAxiosLikeError(400, { message: "Payload invalido" }))
      )
    ).toBe("Payload invalido");

    expect(
      getApiErrorMessage(
        parseApiError(asAxiosLikeError(404, { message: "Nao encontrado" }))
      )
    ).toBe("Nao encontrado");

    expect(
      getApiErrorMessage(
        parseApiError(asAxiosLikeError(409, { message: "Registro duplicado" }))
      )
    ).toBe("Registro duplicado");
  });
});
