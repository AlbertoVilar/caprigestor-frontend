import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  getFarmMilkProductionAnnualSummary,
  getFarmMilkProductionDailySummary,
  getFarmMilkProductionMonthlySummary,
  upsertFarmMilkProductionDaily,
} from "./farmMilkProduction";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe("Farm milk production API", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);
  const mockedPut = vi.mocked(requestBackEnd.put);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts the daily consolidated production using the farm milk route", async () => {
    mockedPut.mockResolvedValueOnce({
      data: {
        productionDate: "2026-03-30",
        registered: true,
        totalProduced: 120,
        withdrawalProduced: 20,
        marketableProduced: 100,
        notes: "Leite restrito por carencia",
      },
    });

    const result = await upsertFarmMilkProductionDaily(17, "2026-03-30", {
      totalProduced: 120,
      withdrawalProduced: 20,
      notes: "Leite restrito por carencia",
    });

    expect(mockedPut).toHaveBeenCalledWith(
      "/goatfarms/17/milk-consolidated-productions/2026-03-30",
      {
        totalProduced: 120,
        withdrawalProduced: 20,
        notes: "Leite restrito por carencia",
      }
    );
    expect(result.marketableProduced).toBe(100);
  });

  it("loads daily, monthly and annual summaries from the canonical routes", async () => {
    mockedGet
      .mockResolvedValueOnce({
        data: {
          productionDate: "2026-03-30",
          registered: true,
          totalProduced: 120,
          withdrawalProduced: 20,
          marketableProduced: 100,
          notes: null,
        },
      })
      .mockResolvedValueOnce({
        data: {
          year: 2026,
          month: 3,
          totalProduced: 3600,
          withdrawalProduced: 300,
          marketableProduced: 3300,
          daysRegistered: 30,
          dailyRecords: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          year: 2026,
          totalProduced: 12400,
          withdrawalProduced: 800,
          marketableProduced: 11600,
          daysRegistered: 90,
          monthlyRecords: [],
        },
      });

    const daily = await getFarmMilkProductionDailySummary(17, "2026-03-30");
    const monthly = await getFarmMilkProductionMonthlySummary(17, 2026, 3);
    const annual = await getFarmMilkProductionAnnualSummary(17, 2026);

    expect(mockedGet).toHaveBeenNthCalledWith(
      1,
      "/goatfarms/17/milk-consolidated-productions/daily",
      { params: { date: "2026-03-30" } }
    );
    expect(mockedGet).toHaveBeenNthCalledWith(
      2,
      "/goatfarms/17/milk-consolidated-productions/monthly",
      { params: { year: 2026, month: 3 } }
    );
    expect(mockedGet).toHaveBeenNthCalledWith(
      3,
      "/goatfarms/17/milk-consolidated-productions/annual",
      { params: { year: 2026 } }
    );
    expect(daily.totalProduced).toBe(120);
    expect(monthly.daysRegistered).toBe(30);
    expect(annual.marketableProduced).toBe(11600);
  });
});
