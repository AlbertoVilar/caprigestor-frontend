import { describe, expect, it } from "vitest";
import {
  buildInitialForm,
  buildPayloadFromForm,
  calculatePurchaseCost,
  mapPayloadToForm,
} from "./inventoryPageState";

describe("inventoryPageState purchase cost", () => {
  it("gera payload com dados de compra quando a entrada for IN", () => {
    const form = {
      ...buildInitialForm(),
      type: "IN" as const,
      quantity: "10",
      movementDate: "2026-03-28",
      reason: "Compra de racao",
      isPurchase: true,
      unitCost: "18.5",
      freightCost: "25",
      discountAmount: "10",
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
      freightCost: 25,
      discountAmount: 10,
      purchaseDate: "2026-03-28",
      supplierName: "Casa do Campo",
    });
  });

  it("bloqueia custo de compra fora de entrada", () => {
    const form = {
      ...buildInitialForm(),
      type: "OUT" as const,
      quantity: "4",
      isPurchase: true,
      unitCost: "10",
      freightCost: "",
      discountAmount: "",
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

  it("calcula subtotal e total em centavos sem erro de ponto flutuante", () => {
    const result = calculatePurchaseCost("32.143", "112", "45.50", "12.25");

    expect(result).toEqual({
      subtotalCents: 360002n,
      freightCents: 4550n,
      discountCents: 1225n,
      totalCents: 363327n,
    });
  });

  it("nao envia total calculado pelo navegador", () => {
    const result = buildPayloadFromForm({
      form: {
        ...buildInitialForm(),
        type: "IN",
        quantity: "32.143",
        isPurchase: true,
        unitCost: "112",
        freightCost: "45.50",
        discountAmount: "12.25",
        purchaseDate: "2026-08-01",
      },
      selectedItemId: "101",
      selectedTrackLot: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.payload?.totalCost).toBeUndefined();
  });

  it("restaura payload legado com apenas custo total", () => {
    const form = mapPayloadToForm({
      type: "IN",
      quantity: 10,
      itemId: 101,
      totalCost: 205,
      freightCost: 25,
      discountAmount: 5,
      purchaseDate: "2026-08-01",
    });

    expect(form.isPurchase).toBe(true);
    expect(form.unitCost).toBe("18.5");
  });

  it("mantem entrada comum sem dados financeiros", () => {
    const initial = buildInitialForm();

    expect(initial.isPurchase).toBe(false);
    expect(initial.purchaseDate).toBe("");
  });
});
