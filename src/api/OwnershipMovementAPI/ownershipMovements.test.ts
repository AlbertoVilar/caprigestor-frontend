import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { listOwnershipMovements } from "./ownershipMovements";
import type { OwnershipMovementPageDTO } from "../../Models/OwnershipMovementDTOs";

vi.mock("../../utils/request", () => ({
  requestBackEnd: { get: vi.fn() },
}));

describe("Ownership movement API", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);
  const page: OwnershipMovementPageDTO = {
    content: [{
      movementId: 71,
      goatId: 55,
      sourceFarmId: 19,
      targetFarmId: 1,
      movementKind: "INTERNAL_SALE",
      status: "REQUESTED",
      direction: "INCOMING",
      reason: "Sale between farms",
      requestedAt: "2026-09-29T12:00:00Z",
      acceptedAt: null,
      effectiveAt: null,
      completedAt: null,
      cancelledAt: null,
      realized: false,
      saleId: 18,
      saleDate: "2026-09-29",
      amount: 500,
      paymentStatus: "PAID",
      paymentDate: "2026-09-29",
    }],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  beforeEach(() => vi.clearAllMocks());

  it("requests the endpoint with direction and pagination while omitting empty filters", async () => {
    mockedGet.mockResolvedValueOnce({ data: page });

    const result = await listOwnershipMovements(19, "INCOMING", undefined, undefined, 2, 20);

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/19/ownership-movements", {
      params: { direction: "INCOMING", page: 2, size: 20 },
    });
    expect(result).toBe(page);
  });

  it("sends both supported optional filters when supplied", async () => {
    mockedGet.mockResolvedValueOnce({ data: page });

    await listOwnershipMovements(1, "OUTGOING", "REQUESTED", "INTERNAL_SALE", 0, 20);

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/1/ownership-movements", {
      params: {
        direction: "OUTGOING",
        status: "REQUESTED",
        kind: "INTERNAL_SALE",
        page: 0,
        size: 20,
      },
    });
  });

  it("propagates request errors without translating movement semantics", async () => {
    const error = new Error("network failure");
    mockedGet.mockRejectedValueOnce(error);

    await expect(listOwnershipMovements(19, "INCOMING")).rejects.toBe(error);
  });
});
