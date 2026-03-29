import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { createMilkProduction, listMilkProductions } from "./milkProduction";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("Milk production withdrawal snapshot API", () => {
  const mockedPost = vi.mocked(requestBackEnd.post);
  const mockedGet = vi.mocked(requestBackEnd.get);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the withdrawal snapshot when a production is recorded during withdrawal", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        id: 91,
        date: "2026-03-29",
        shift: "MORNING",
        volumeLiters: 1.25,
        status: "ACTIVE",
        recordedDuringMilkWithdrawal: true,
        milkWithdrawalEventId: 13,
        milkWithdrawalEndDate: "2026-03-31",
        milkWithdrawalSource: "Produto QA Carencia",
      },
    });

    const result = await createMilkProduction(17, "QAT03281450", {
      date: "2026-03-29",
      shift: "MORNING",
      volumeLiters: 1.25,
      notes: "Ordenha em carencia",
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/goatfarms/17/goats/QAT03281450/milk-productions",
      {
        date: "2026-03-29",
        shift: "MORNING",
        volumeLiters: 1.25,
        notes: "Ordenha em carencia",
      }
    );
    expect(result.recordedDuringMilkWithdrawal).toBe(true);
    expect(result.milkWithdrawalEndDate).toBe("2026-03-31");
    expect(result.milkWithdrawalSource).toBe("Produto QA Carencia");
  });

  it("keeps the withdrawal snapshot in the list response", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 91,
            date: "2026-03-29",
            shift: "MORNING",
            volumeLiters: 1.25,
            status: "ACTIVE",
            recordedDuringMilkWithdrawal: true,
            milkWithdrawalEventId: 13,
            milkWithdrawalEndDate: "2026-03-31",
            milkWithdrawalSource: "Produto QA Carencia",
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      },
    });

    const result = await listMilkProductions(17, "QAT03281450", {
      page: 0,
      size: 10,
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
    });

    expect(mockedGet).toHaveBeenCalledWith(
      "/goatfarms/17/goats/QAT03281450/milk-productions",
      expect.objectContaining({
        params: expect.any(URLSearchParams),
      })
    );
    expect(result.content[0].recordedDuringMilkWithdrawal).toBe(true);
    expect(result.content[0].milkWithdrawalEventId).toBe(13);
  });
});
