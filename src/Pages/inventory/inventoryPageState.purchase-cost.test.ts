import { describe, expect, it } from "vitest";
import { buildInitialForm, buildPayloadFromForm } from "./inventoryPageState";

describe("inventoryPageState purchase cost", () => {
  it("gera payload com dados de compra quando a entrada for IN", () => {
    const form = {
      ...buildInitialForm(),
      type: "IN" as const,
      quantity: "10",
      movementDate: "2026-03-28",
      reason: "Compra de racao",
      unitCost: "18.5",
      totalCost: "185",
      purchaseDate: "2026-03-28",
      supplierName: "Casa do Campo",
    };

    const result = buildPayloadFromForm({
      form,
      selectedItemId: "101",
      selectedTrackLot: false,
    });

    expect(result.payload).toEqual({
      type: "IN",
      quantity: 10,
      itemId: 101,
      movementDate: "2026-03-28",
      reason: "Compra de racao",
      unitCost: 18.5,
      totalCost: 185,
      purchaseDate: "2026-03-28",
      supplierName: "Casa do Campo",
    });
  });

  it("bloqueia custo de compra fora de entrada", () => {
    const form = {
      ...buildInitialForm(),
      type: "OUT" as const,
      quantity: "4",
      unitCost: "10",
      totalCost: "",
      purchaseDate: "2026-03-28",
      supplierName: "",
    };

    const result = buildPayloadFromForm({
      form,
      selectedItemId: "101",
      selectedTrackLot: false,
    });

    expect(result.error).toBe("Custo de compra só pode ser informado em entradas de estoque.");
  });
});
