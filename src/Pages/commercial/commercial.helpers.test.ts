import { describe, expect, it } from "vitest";
import { buildCommercialSummaryCards, formatCommercialCurrency, formatCommercialDate, formatPaymentStatusLabel, isOpenReceivable } from "./commercial.helpers";

describe("commercial helpers", () => {
  it("formata moeda e datas do backend sem depender de dado fake", () => {
    expect(formatCommercialCurrency(1530.5)).toBe("R$ 1.530,50");
    expect(formatCommercialDate([2026, 3, 26])).toBe("26/03/2026");
  });

  it("monta cards e labels operacionais do resumo comercial", () => {
    const cards = buildCommercialSummaryCards({
      customerCount: 4,
      animalSalesCount: 2,
      animalSalesTotal: 3200,
      milkSalesCount: 3,
      milkSalesQuantityLiters: 120,
      milkSalesTotal: 580,
      openReceivablesCount: 2,
      openReceivablesTotal: 710,
      paidReceivablesCount: 3,
      paidReceivablesTotal: 3070,
    });

    expect(cards[0]).toEqual({ label: "Clientes ativos", value: "4" });
    expect(cards[3]).toEqual({ label: "Recebiveis em aberto", value: "R$ 710,00" });
    expect(formatPaymentStatusLabel("OPEN")).toBe("Em aberto");
    expect(isOpenReceivable({
      sourceType: "ANIMAL_SALE",
      sourceId: 1,
      sourceLabel: "Venda do animal G01",
      customerId: 2,
      customerName: "Cliente",
      amount: 100,
      dueDate: "2026-03-26",
      paymentStatus: "OPEN",
      paymentDate: null,
      notes: null,
    })).toBe(true);
  });
});
