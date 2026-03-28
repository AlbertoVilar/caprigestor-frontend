import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  createOperationalExpense,
  fetchMonthlyOperationalSummary,
  listOperationalExpenses,
} from "./commercial";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("Commercial API operational finance", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);
  const mockedPost = vi.mocked(requestBackEnd.post);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria despesa operacional na rota comercial da fazenda", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        id: 1,
        category: "ENERGY",
        description: "Conta de luz",
        amount: 210,
        expenseDate: "2026-03-28",
        notes: "Marco",
      },
    });

    const result = await createOperationalExpense(17, {
      category: "ENERGY",
      description: "Conta de luz",
      amount: 210,
      expenseDate: "2026-03-28",
      notes: "Marco",
    });

    expect(mockedPost).toHaveBeenCalledWith("/goatfarms/17/commercial/operational-expenses", {
      category: "ENERGY",
      description: "Conta de luz",
      amount: 210,
      expenseDate: "2026-03-28",
      notes: "Marco",
    });
    expect(result.id).toBe(1);
  });

  it("lista despesas e resumo mensal da rota comercial", async () => {
    mockedGet
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            category: "ENERGY",
            description: "Conta de luz",
            amount: 210,
            expenseDate: "2026-03-28",
            notes: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          year: 2026,
          month: 3,
          totalRevenue: 1780,
          totalExpenses: 750,
          balance: 1030,
          animalSalesRevenue: 1400,
          milkSalesRevenue: 380,
          operationalExpensesTotal: 250,
          inventoryPurchaseCostsTotal: 500,
        },
      });

    const expenses = await listOperationalExpenses(17);
    const summary = await fetchMonthlyOperationalSummary(17, 2026, 3);

    expect(mockedGet).toHaveBeenNthCalledWith(1, "/goatfarms/17/commercial/operational-expenses");
    expect(mockedGet).toHaveBeenNthCalledWith(2, "/goatfarms/17/commercial/monthly-summary", {
      params: { year: 2026, month: 3 },
    });
    expect(expenses).toHaveLength(1);
    expect(summary.balance).toBe(1030);
  });
});
