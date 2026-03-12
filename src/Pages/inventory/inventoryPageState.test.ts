import { describe, expect, it } from "vitest";
import {
  buildPayloadFromForm,
  hasInvalidDateRange,
  INVENTORY_TECHNICAL_DETAILS_DEFAULT_OPEN,
  shouldRequireLotId,
  validateInventoryItemPayload,
  validateInventoryLotPayload,
  type InventoryFormState,
} from "./inventoryPageState";

const baseForm: InventoryFormState = {
  type: "OUT",
  quantity: "2",
  lotId: "",
  adjustDirection: "",
  movementDate: "2026-02-28",
  reason: "Baixa de teste",
};

describe("inventoryPageState", () => {
  it("requires lotId when the selected item tracks lot", () => {
    expect(shouldRequireLotId(true)).toBe(true);

    const result = buildPayloadFromForm({
      form: baseForm,
      selectedItemId: "15",
      selectedTrackLot: true,
    });

    expect(result.payload).toBeUndefined();
    expect(result.error).toBe("Selecione um lote válido para este produto.");
  });

  it("does not require lotId when the selected item does not track lot", () => {
    expect(shouldRequireLotId(false)).toBe(false);

    const result = buildPayloadFromForm({
      form: baseForm,
      selectedItemId: "15",
      selectedTrackLot: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.payload).toMatchObject({
      itemId: 15,
      quantity: 2,
    });
    expect(result.payload?.lotId).toBeUndefined();
  });

  it("validates item creation name before submitting", () => {
    expect(validateInventoryItemPayload({ name: "   " })).toBe("Informe o nome do item.");
    expect(
      validateInventoryItemPayload({
        name: "a".repeat(121),
      })
    ).toBe("O nome do produto deve ter no máximo 120 caracteres.");
  });

  it("validates lot payload before submitting", () => {
    expect(validateInventoryLotPayload({ code: "   ", description: "" }, true)).toBe(
      "Informe o código do lote."
    );
    expect(
      validateInventoryLotPayload({ code: "A".repeat(81), description: "" }, true)
    ).toBe("O código do lote deve ter no máximo 80 caracteres.");
    expect(validateInventoryLotPayload({ code: "L-1", description: "" }, false)).toBe(
      "Selecione um produto com controle por lote antes de cadastrar um lote."
    );
  });

  it("detects invalid date ranges for movement history filters", () => {
    expect(hasInvalidDateRange("2026-03-01", "2026-02-28")).toBe(true);
    expect(hasInvalidDateRange("2026-02-01", "2026-02-28")).toBe(false);
    expect(hasInvalidDateRange("", "2026-02-28")).toBe(false);
  });

  it("keeps technical details hidden by default", () => {
    expect(INVENTORY_TECHNICAL_DETAILS_DEFAULT_OPEN).toBe(false);
  });
});