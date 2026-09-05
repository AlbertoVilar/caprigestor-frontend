import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFarmPendingBirthAlerts } from "../../../api/GoatFarmAPI/reproduction";
import { PregnancyDueAlertProvider } from "./PregnancyDueAlertProvider";

vi.mock("../../../api/GoatFarmAPI/reproduction", () => ({
  getFarmPendingBirthAlerts: vi.fn(),
}));

const mockedGetFarmPendingBirthAlerts = vi.mocked(getFarmPendingBirthAlerts);

describe("PregnancyDueAlertProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps overdue births to a high-priority reproduction alert", async () => {
    mockedGetFarmPendingBirthAlerts.mockResolvedValueOnce({
      totalPending: 1,
      alerts: [{
        pregnancyId: 27,
        goatId: "1615325001",
        expectedDueDate: "2026-07-01",
        daysOverdue: 9,
      }],
    });

    const summary = await PregnancyDueAlertProvider.getSummary(14);

    expect(mockedGetFarmPendingBirthAlerts).toHaveBeenCalledWith(14, { page: 0, size: 5 });
    expect(summary).toMatchObject({
      count: 1,
      headline: "Maior atraso: 9 dias",
      highestSeverity: "high",
    });
    expect(summary.previewItems?.[0]).toMatchObject({
      source: "reproduction",
      severity: "high",
      priority: 409,
      goatId: "1615325001",
      actionLabel: "Registrar parto",
      link: "/app/goatfarms/14/goats/1615325001/reproduction?action=register-birth",
    });
  });

  it("forwards list parameters and keeps a due-today birth low severity", async () => {
    mockedGetFarmPendingBirthAlerts.mockResolvedValueOnce({
      totalPending: 1,
      alerts: [{
        pregnancyId: 28,
        goatId: "GOAT-002",
        expectedDueDate: "2026-07-03",
        daysOverdue: 0,
      }],
    });

    const list = await PregnancyDueAlertProvider.getList?.(14, {
      referenceDate: "2026-07-03",
      page: 1,
      size: 20,
    });

    expect(mockedGetFarmPendingBirthAlerts).toHaveBeenCalledWith(14, {
      referenceDate: "2026-07-03",
      page: 1,
      size: 20,
    });
    expect(list?.[0]).toMatchObject({
      title: "Parto previsto para hoje: GOAT-002",
      severity: "low",
      priority: 300,
    });
  });

  it("propagates summary errors so the UI does not report a false zero", async () => {
    mockedGetFarmPendingBirthAlerts.mockRejectedValueOnce(new Error("network"));

    await expect(PregnancyDueAlertProvider.getSummary(14)).rejects.toThrow("network");
  });

  it("propagates list errors so the UI can disclose partial data", async () => {
    mockedGetFarmPendingBirthAlerts.mockRejectedValueOnce(new Error("network"));

    await expect(PregnancyDueAlertProvider.getList?.(14)).rejects.toThrow("network");
  });
});
