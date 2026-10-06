import { describe, expect, it } from "vitest";
import { getMilkErrorMessage } from "./MilkProductionPage";

describe("MilkProductionPage error messaging", () => {
  it("shows the ownership-date explanation based on the stable error code", () => {
    expect(
      getMilkErrorMessage(
        { status: 422, code: "GOAT_OWNERSHIP_NOT_VALID_ON_DATE" },
        "create"
      )
    ).toContain("histórico de transferência");
  });

  it("keeps actual authorization failures on the permission message", () => {
    expect(getMilkErrorMessage({ status: 403 }, "create")).toBe(
      "Sem permissão para acessar esta fazenda."
    );
  });
});
