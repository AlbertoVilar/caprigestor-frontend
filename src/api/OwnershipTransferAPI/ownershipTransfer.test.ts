import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  acceptOwnershipTransfer,
  cancelOwnershipTransfer,
  getOwnershipTransfer,
  listOwnershipTransfers,
  rejectOwnershipTransfer,
  requestInternalTransfer,
} from "./ownershipTransfer";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Ownership transfer API", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);
  const mockedPost = vi.mocked(requestBackEnd.post);
  const response = {
    id: 900,
    goatId: 123,
    sourceFarmId: 10,
    targetFarmId: 45,
    kind: "INTERNAL_TRANSFER" as const,
    status: "REQUESTED" as const,
    reason: "Transfer between farms",
    requestedAt: "2026-09-14T12:00:00Z",
    acceptedAt: null,
    effectiveAt: null,
    completedAt: null,
    cancelledAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an internal transfer without a client-supplied source farm", async () => {
    mockedPost.mockResolvedValueOnce({ data: response });

    await requestInternalTransfer({
      goatId: 123,
      targetFarmId: 45,
      reason: "Transfer between farms",
      idempotencyKey: "client-key",
    });

    expect(mockedPost).toHaveBeenCalledWith("/ownership-transfers", {
      goatId: 123,
      targetFarmId: 45,
      reason: "Transfer between farms",
      idempotencyKey: "client-key",
    });
    expect(mockedPost.mock.calls[0][1]).not.toHaveProperty("sourceFarmId");
  });

  it("maps transfer detail and lifecycle commands to the W7 routes", async () => {
    mockedGet.mockResolvedValueOnce({ data: response });
    mockedPost
      .mockResolvedValueOnce({ data: { ...response, status: "COMPLETED" } })
      .mockResolvedValueOnce({ data: { ...response, status: "REJECTED" } })
      .mockResolvedValueOnce({ data: { ...response, status: "CANCELLED" } });

    await getOwnershipTransfer(900);
    await acceptOwnershipTransfer(900);
    await rejectOwnershipTransfer(900);
    await cancelOwnershipTransfer(900);

    expect(mockedGet).toHaveBeenCalledWith("/ownership-transfers/900");
    expect(mockedPost).toHaveBeenNthCalledWith(1, "/ownership-transfers/900/accept");
    expect(mockedPost).toHaveBeenNthCalledWith(2, "/ownership-transfers/900/reject");
    expect(mockedPost).toHaveBeenNthCalledWith(3, "/ownership-transfers/900/cancel");
  });

  it("lists incoming transfers with optional status and preserves pagination metadata", async () => {
    const page = {
      content: [response],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    mockedGet.mockResolvedValueOnce({ data: page });

    const result = await listOwnershipTransfers(45, "INCOMING", "REQUESTED", 0, 20);

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/45/ownership-transfers", {
      params: { direction: "INCOMING", status: "REQUESTED", page: 0, size: 20 },
    });
    expect(result).toEqual(page);
    expect(result.totalElements).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("lists outgoing transfers without inventing a status parameter", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { content: [], totalElements: 0, totalPages: 0, number: 1, size: 10 },
    });

    await listOwnershipTransfers(10, "OUTGOING", undefined, 1, 10);

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/10/ownership-transfers", {
      params: { direction: "OUTGOING", page: 1, size: 10 },
    });
  });
});
