import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  acceptOwnershipSale,
  cancelOwnershipSale,
  listIncomingOwnershipSales,
  registerOwnershipSalePayment,
  rejectOwnershipSale,
  requestOwnershipSale,
} from "./commercial";

vi.mock("../../utils/request", () => ({
  requestBackEnd: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

describe("Commercial API ownership sale", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);
  const mockedPost = vi.mocked(requestBackEnd.post);
  const mockedPatch = vi.mocked(requestBackEnd.patch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the farm-scoped ownership sale request endpoint with an explicit target farm", async () => {
    mockedPost.mockResolvedValueOnce({ data: { saleId: 91, ownershipTransferStatus: "REQUESTED" } });

    const result = await requestOwnershipSale(10, {
      goatId: "technical-42", customerId: 7, targetFarmId: 20, saleDate: "2026-09-18", amount: 100,
      dueDate: "2026-09-20", notes: "sale", idempotencyKey: "sale-42",
    });

    expect(mockedPost).toHaveBeenCalledWith("/goatfarms/10/commercial/ownership-sales", expect.objectContaining({
      goatId: "technical-42", targetFarmId: 20, idempotencyKey: "sale-42",
    }));
    expect(result.ownershipTransferStatus).toBe("REQUESTED");
  });

  it("delegates independent payment/acceptance actions and incoming reads to the backend workflow", async () => {
    mockedPost.mockResolvedValue({ data: { saleId: 91, ownershipTransferStatus: "COMPLETED" } });
    mockedGet.mockResolvedValueOnce({ data: [{ saleId: 91, ownershipTransferStatus: "REQUESTED" }] });

    mockedPatch.mockResolvedValueOnce({ data: { saleId: 91, paymentStatus: "PAID" } });
    await acceptOwnershipSale(10, 91);
    await registerOwnershipSalePayment(10, 91, { paymentDate: "2026-09-19" });
    await rejectOwnershipSale(10, 91);
    await cancelOwnershipSale(10, 91);
    const incoming = await listIncomingOwnershipSales(20);

    expect(mockedPost).toHaveBeenNthCalledWith(1, "/goatfarms/10/commercial/ownership-sales/91/accept");
    expect(mockedPatch).toHaveBeenCalledWith("/goatfarms/10/commercial/ownership-sales/91/payment", { paymentDate: "2026-09-19" });
    expect(mockedPost).toHaveBeenNthCalledWith(2, "/goatfarms/10/commercial/ownership-sales/91/reject");
    expect(mockedPost).toHaveBeenNthCalledWith(3, "/goatfarms/10/commercial/ownership-sales/91/cancel");
    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/20/commercial/ownership-sales/incoming");
    expect(incoming).toHaveLength(1);
  });
});
