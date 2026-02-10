import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFarmDryOffAlerts } from "../../../api/GoatFarmAPI/lactation";
import { LactationDryOffAlertProvider } from "./LactationDryOffAlertProvider";

vi.mock("../../../api/GoatFarmAPI/lactation", () => ({
  getFarmDryOffAlerts: vi.fn(),
}));

const mockedGetFarmDryOffAlerts = vi.mocked(getFarmDryOffAlerts);

describe("LactationDryOffAlertProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps summary data from farm-level dry-off endpoint", async () => {
    mockedGetFarmDryOffAlerts.mockResolvedValueOnce({
      totalPending: 2,
      alerts: [
        {
          goatId: "GOAT-001",
          startDatePregnancy: "2025-11-01",
          dryOffDate: "2026-02-09",
          gestationDays: 100,
          daysOverdue: 4,
        },
        {
          goatId: "GOAT-002",
          startDatePregnancy: "2025-11-05",
          dryOffDate: "2026-02-10",
          gestationDays: 98,
          daysOverdue: 0,
        },
      ],
    });

    const summary = await LactationDryOffAlertProvider.getSummary(42);

    expect(mockedGetFarmDryOffAlerts).toHaveBeenCalledWith(42, {
      page: 0,
      size: 5,
    });
    expect(summary.count).toBe(2);
    expect(summary.headline).toBe("Maior atraso: 4 dia(s)");
    expect(summary.worstOverdueDays).toBe(4);
    expect(summary.previewItems).toHaveLength(2);
    expect(summary.previewItems?.[0]).toMatchObject({
      id: "GOAT-001-2026-02-09",
      goatId: "GOAT-001",
      severity: "high",
      dryOffDate: "2026-02-09",
      daysOverdue: 4,
      link: "/app/goatfarms/42/goats/GOAT-001/lactations/active",
      actionLabel: "Ver lactacao",
    });
    expect(summary.previewItems?.[1]).toMatchObject({
      severity: "medium",
    });
  });

  it("maps paginated list and forwards query params", async () => {
    mockedGetFarmDryOffAlerts.mockResolvedValueOnce({
      totalPending: 1,
      alerts: [
        {
          goatId: "GOAT-777",
          startDatePregnancy: "2025-10-10",
          dryOffDate: "2026-02-20",
          gestationDays: 105,
          daysOverdue: -2,
        },
      ],
    });

    const list = await LactationDryOffAlertProvider.getList?.(42, {
      referenceDate: "2026-02-10",
      page: 2,
      size: 20,
    });

    expect(mockedGetFarmDryOffAlerts).toHaveBeenCalledWith(42, {
      referenceDate: "2026-02-10",
      page: 2,
      size: 20,
    });
    expect(list).toHaveLength(1);
    expect(list?.[0]).toMatchObject({
      id: "GOAT-777-2026-02-20",
      severity: "low",
      dryOffDate: "2026-02-20",
      daysOverdue: -2,
    });
  });

  it("returns safe fallback when summary request fails", async () => {
    mockedGetFarmDryOffAlerts.mockRejectedValueOnce(new Error("network"));

    const summary = await LactationDryOffAlertProvider.getSummary(42);

    expect(summary).toEqual({ count: 0 });
  });
});
