import { describe, expect, it } from "vitest";
import {
  buildPayloadFromForm,
  hasInvalidDateRange,
  shouldRequireLotId,
  validateInventoryItemPayload,
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
    expect(result.error).toBe("Informe um lote válido para este item.");
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
    ).toBe("O nome do item deve ter no máximo 120 caracteres.");
  });

  it("detects invalid date ranges for movement history filters", () => {
    expect(hasInvalidDateRange("2026-03-01", "2026-02-28")).toBe(true);
    expect(hasInvalidDateRange("2026-02-01", "2026-02-28")).toBe(false);
    expect(hasInvalidDateRange("", "2026-02-28")).toBe(false);
  });
});
