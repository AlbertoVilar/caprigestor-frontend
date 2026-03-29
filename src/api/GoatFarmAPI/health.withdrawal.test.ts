import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { healthAPI } from "./health";

vi.mock("../../utils/request", () => ({
  requestBackEnd: vi.fn()
}));

describe("Health API withdrawal status", () => {
  const mockedRequest = vi.mocked(requestBackEnd);

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
});
