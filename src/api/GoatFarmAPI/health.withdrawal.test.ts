import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { AlertsEventBus } from "../../services/alerts/AlertsEventBus";
import { healthAPI } from "./health";

vi.mock("../../utils/request", () => ({
  requestBackEnd: vi.fn()
}));

vi.mock("../../services/alerts/AlertsEventBus", () => ({
  AlertsEventBus: {
    emit: vi.fn()
  }
}));

describe("Health API", () => {
  const mockedRequest = vi.mocked(requestBackEnd);
  const mockedEmit = vi.mocked(AlertsEventBus.emit);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests withdrawal status using the canonical route", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        goatId: "QAT03281450",
        referenceDate: "2026-03-29",
        hasActiveMilkWithdrawal: true,
        hasActiveMeatWithdrawal: true,
        milkWithdrawal: {
          eventId: 13,
          title: "Tratamento QA carencia",
          productName: "Produto QA Carencia",
          withdrawalEndDate: "2026-03-31"
        },
        meatWithdrawal: {
          eventId: 13,
          title: "Tratamento QA carencia",
          productName: "Produto QA Carencia",
          withdrawalEndDate: "2026-03-31"
        }
      }
    });

    const result = await healthAPI.getWithdrawalStatus(17, "QAT03281450", "2026-03-29");

    expect(mockedRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/goatfarms/17/goats/QAT03281450/health-events/withdrawal-status",
      params: { referenceDate: "2026-03-29" }
    });
    expect(result.hasActiveMilkWithdrawal).toBe(true);
    expect(result.milkWithdrawal?.withdrawalEndDate).toBe("2026-03-31");
  });

  it("omits referenceDate when it is not provided", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        goatId: "TSTKID2602",
        referenceDate: "2026-03-29",
        hasActiveMilkWithdrawal: false,
        hasActiveMeatWithdrawal: false,
        milkWithdrawal: null,
        meatWithdrawal: null
      }
    });

    const result = await healthAPI.getWithdrawalStatus(17, "TSTKID2602");

    expect(mockedRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/goatfarms/17/goats/TSTKID2602/health-events/withdrawal-status",
      params: undefined
    });
    expect(result.hasActiveMilkWithdrawal).toBe(false);
    expect(result.hasActiveMeatWithdrawal).toBe(false);
  });

  it.each([
    ["create", () => healthAPI.create(17, "CABRA-01", {} as never)],
    ["update", () => healthAPI.update(17, "CABRA-01", 23, {} as never)],
    ["mark as done", () => healthAPI.markAsDone(17, "CABRA-01", 23, {} as never)],
    ["cancel", () => healthAPI.cancel(17, "CABRA-01", 23, {} as never)],
    ["reopen", () => healthAPI.reopen(17, "CABRA-01", 23)]
  ])("invalidates farm alerts after a successful %s mutation", async (_name, mutate) => {
    mockedRequest.mockResolvedValueOnce({ data: { id: 23 } });

    await mutate();

    expect(mockedEmit).toHaveBeenCalledOnce();
    expect(mockedEmit).toHaveBeenCalledWith(17);
  });

  it("does not invalidate alerts when the health mutation fails", async () => {
    mockedRequest.mockRejectedValueOnce(new Error("network"));

    await expect(
      healthAPI.markAsDone(17, "CABRA-01", 23, {} as never)
    ).rejects.toThrow("network");

    expect(mockedEmit).not.toHaveBeenCalled();
  });
});
