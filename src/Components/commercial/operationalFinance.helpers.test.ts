import { describe, expect, it } from "vitest";
import {
  buildMonthlyOperationalSummaryCards,
  formatOperationalExpenseCategoryLabel,
} from "./operationalFinance.helpers";

describe("operational finance helpers", () => {
  it("formata categorias e cards do resumo mensal", () => {
    expect(formatOperationalExpenseCategoryLabel("VETERINARY")).toBe("Servico veterinario");

    const cards = buildMonthlyOperationalSummaryCards({
      year: 2026,
      month: 3,
      totalRevenue: 1780,
      totalExpenses: 750,
      balance: 1030,
      animalSalesRevenue: 1400,
      milkSalesRevenue: 380,
      operationalExpensesTotal: 250,
      inventoryPurchaseCostsTotal: 500,
    });

    expect(cards[0]).toEqual({ label: "Entrou no mes", value: "R$ 1.780,00" });
    expect(cards[6]).toEqual({ label: "Compras de estoque", value: "R$ 500,00" });
  });
});
