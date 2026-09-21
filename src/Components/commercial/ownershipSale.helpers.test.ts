import { describe, expect, it, vi } from "vitest";
import {
  getEligibleBuyerFarms,
  getOwnershipSaleIntent,
  resolveDefaultBuyerFarmId,
} from "./ownershipSale.helpers";

const farms = [
  { id: 19, name: "Capril Bocaina" },
  { id: 1, name: "Capril Vilar" },
] as never[];

describe("ownership sale UX helpers", () => {
  it("excludes the source farm and preselects only a unique destination", () => {
    const eligible = getEligibleBuyerFarms(farms, 19);

    expect(eligible).toEqual([{ id: 1, name: "Capril Vilar" }]);
    expect(resolveDefaultBuyerFarmId(eligible)).toBe(1);
    expect(resolveDefaultBuyerFarmId(farms)).toBe(0);
  });

  it("reuses the key for a retry and creates a new one when intent changes", () => {
    const createKey = vi.fn()
      .mockReturnValueOnce("sale-key-1")
      .mockReturnValueOnce("sale-key-2");
    const input = {
      goatId: "technical-79",
      targetFarmId: 1,
      customerId: 7,
      saleDate: "2026-09-21",
      amount: 100,
      dueDate: "2026-09-30",
    };

    const first = getOwnershipSaleIntent({ current: null, input, createKey });
    const retry = getOwnershipSaleIntent({ current: first, input, createKey });
    const changedDestination = getOwnershipSaleIntent({
      current: retry,
      input: { ...input, targetFarmId: 2 },
      createKey,
    });

    expect(first.key).toBe("sale-key-1");
    expect(retry).toBe(first);
    expect(changedDestination.key).toBe("sale-key-2");
    expect(createKey).toHaveBeenCalledTimes(2);
  });
});
