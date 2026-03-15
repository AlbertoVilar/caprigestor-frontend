import { beforeEach, describe, expect, it, vi } from "vitest";
import { healthAPI } from "../../../api/GoatFarmAPI/health";
import { HealthAlertProvider } from "./HealthAlertProvider";

vi.mock("../../../api/GoatFarmAPI/health", () => ({
  healthAPI: {
    getAlerts: vi.fn()
  }
}));

const mockedGetAlerts = vi.mocked(healthAPI.getAlerts);

describe("HealthAlertProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps summary with all categories", async () => {
    mockedGetAlerts.mockResolvedValueOnce({
      dueTodayCount: 2,
      upcomingCount: 3,
      overdueCount: 1,
      dueTodayTop: [],
      upcomingTop: [],
      overdueTop: []
    });

    const summary = await HealthAlertProvider.getSummary(4);

    expect(summary).toEqual({
      count: 6,
      headline: "1 atrasado(s)",
      worstOverdueDays: 1
    });
  });

  it("maps list with source/severity/priority", async () => {
    mockedGetAlerts.mockResolvedValueOnce({
      dueTodayCount: 1,
      upcomingCount: 1,
      overdueCount: 1,
      dueTodayTop: [
        {
          id: 2,
          farmId: 4,
          goatId: "GOAT-2",
          type: "VACINA",
          status: "AGENDADO",
          title: "Vacina",
          scheduledDate: "2026-03-15",
          overdue: false
        }
      ],
      upcomingTop: [
        {
          id: 3,
          farmId: 4,
          goatId: "GOAT-3",
          type: "VACINA",
          status: "AGENDADO",
          title: "Reforco",
          scheduledDate: "2026-03-17",
          overdue: false
        }
      ],
      overdueTop: [
        {
          id: 1,
          farmId: 4,
          goatId: "GOAT-1",
          type: "VACINA",
          status: "AGENDADO",
          title: "Atrasado",
          scheduledDate: "2026-03-10",
          overdue: true
        }
      ]
    });

    const list = await HealthAlertProvider.getList?.(4);

    expect(list).toHaveLength(3);
    expect(list?.[0]).toMatchObject({
      id: "health-1-overdue",
      source: "health",
      severity: "high",
      priority: 350
    });
    expect(list?.[1]).toMatchObject({
      id: "health-2-due_today",
      source: "health",
      severity: "medium",
      priority: 240
    });
    expect(list?.[2]).toMatchObject({
      id: "health-3-upcoming",
      source: "health",
      severity: "low",
      priority: 120
    });
  });

  it("returns empty list on failure", async () => {
    mockedGetAlerts.mockRejectedValueOnce(new Error("network"));

    const list = await HealthAlertProvider.getList?.(4);

    expect(list).toEqual([]);
  });
});
