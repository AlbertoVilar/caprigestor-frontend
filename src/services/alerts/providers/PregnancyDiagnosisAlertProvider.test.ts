import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFarmPregnancyDiagnosisAlerts } from "../../../api/GoatFarmAPI/reproduction";
import { PregnancyDiagnosisAlertProvider } from "./PregnancyDiagnosisAlertProvider";

vi.mock("../../../api/GoatFarmAPI/reproduction", () => ({
  getFarmPregnancyDiagnosisAlerts: vi.fn()
}));

const mockedGetFarmPregnancyDiagnosisAlerts = vi.mocked(getFarmPregnancyDiagnosisAlerts);

describe("PregnancyDiagnosisAlertProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps summary with canonical source/severity/priority", async () => {
    mockedGetFarmPregnancyDiagnosisAlerts.mockResolvedValueOnce({
      totalPending: 2,
      alerts: [
        {
          goatId: "GOAT-001",
          eligibleDate: "2026-03-10",
          daysOverdue: 12,
          lastCoverageDate: "2026-01-01",
          lastCheckDate: null
        },
        {
          goatId: "GOAT-002",
          eligibleDate: "2026-03-11",
          daysOverdue: 0,
          lastCoverageDate: "2026-01-05",
          lastCheckDate: null
        }
      ]
    });

    const summary = await PregnancyDiagnosisAlertProvider.getSummary(7);

    expect(mockedGetFarmPregnancyDiagnosisAlerts).toHaveBeenCalledWith(7, { page: 0, size: 5 });
    expect(summary.count).toBe(2);
    expect(summary.headline).toBe("Maior atraso: 12 dias");
    expect(summary.previewItems?.[0]).toMatchObject({
      source: "reproduction",
      severity: "high",
      priority: 312,
      goatId: "GOAT-001"
    });
  });

  it("maps list forwarding params", async () => {
    mockedGetFarmPregnancyDiagnosisAlerts.mockResolvedValueOnce({
      totalPending: 1,
      alerts: [
        {
          goatId: "GOAT-003",
          eligibleDate: "2026-03-12",
          daysOverdue: 3,
          lastCoverageDate: "2026-01-07",
          lastCheckDate: null
        }
      ]
    });

    const list = await PregnancyDiagnosisAlertProvider.getList?.(9, {
      referenceDate: "2026-03-12",
      page: 2,
      size: 20
    });

    expect(mockedGetFarmPregnancyDiagnosisAlerts).toHaveBeenCalledWith(9, {
      referenceDate: "2026-03-12",
      page: 2,
      size: 20
    });
    expect(list).toHaveLength(1);
    expect(list?.[0]).toMatchObject({
      source: "reproduction",
      severity: "medium",
      priority: 303,
      actionLabel: "Ver reproducao"
    });
  });

  it("returns safe fallback on summary error", async () => {
    mockedGetFarmPregnancyDiagnosisAlerts.mockRejectedValueOnce(new Error("network"));

    const summary = await PregnancyDiagnosisAlertProvider.getSummary(7);

    expect(summary).toEqual({ count: 0 });
  });
});
