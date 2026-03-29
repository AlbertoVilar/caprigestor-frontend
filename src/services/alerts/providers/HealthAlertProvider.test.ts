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
      activeMilkWithdrawalCount: 1,
      activeMeatWithdrawalCount: 2,
      dueTodayTop: [],
      upcomingTop: [],
      overdueTop: [],
      milkWithdrawalTop: [],
      meatWithdrawalTop: []
    });

    const summary = await HealthAlertProvider.getSummary(4);

    expect(summary).toEqual({
      count: 9,
      headline: "1 atrasado(s)",
      worstOverdueDays: 1
    });
  });

  it("maps list with withdrawal alerts before health agenda items", async () => {
    mockedGetAlerts.mockResolvedValueOnce({
      dueTodayCount: 1,
      upcomingCount: 1,
      overdueCount: 1,
      activeMilkWithdrawalCount: 1,
      activeMeatWithdrawalCount: 1,
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
      ],
      milkWithdrawalTop: [
        {
          eventId: 21,
          goatId: "GOAT-MILK",
          title: "Tratamento de mastite",
          productName: "Antibiotico A",
          withdrawalEndDate: "2026-03-18",
          daysRemaining: 3
        }
      ],
      meatWithdrawalTop: [
        {
          eventId: 22,
          goatId: "GOAT-MEAT",
          title: "Tratamento clinico",
          productName: "Antiinflamatorio B",
          withdrawalEndDate: "2026-03-20",
          daysRemaining: 5
        }
      ]
    });

    const list = await HealthAlertProvider.getList?.(4);

    expect(list).toHaveLength(5);
    expect(list?.[0]).toMatchObject({
      id: "health-withdrawal-milk-21",
      source: "health",
      severity: "high",
      priority: 420
    });
    expect(list?.[1]).toMatchObject({
      id: "health-withdrawal-meat-22",
      source: "health",
      severity: "medium",
      priority: 280
    });
    expect(list?.[2]).toMatchObject({
      id: "health-1-overdue"
    });
  });

  it("returns empty list on failure", async () => {
    mockedGetAlerts.mockRejectedValueOnce(new Error("network"));

    const list = await HealthAlertProvider.getList?.(4);

    expect(list).toEqual([]);
  });
});
