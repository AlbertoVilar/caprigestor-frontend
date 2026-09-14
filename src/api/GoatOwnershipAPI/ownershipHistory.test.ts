import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  getGoatOwnershipHistory,
  InvalidGoatIdError,
} from "./ownershipHistory";

vi.mock("../../utils/request", () => ({
  requestBackEnd: { get: vi.fn() },
}));

describe("Goat ownership history API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests history using only a positive structural GoatId", async () => {
    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({
      data: { goatId: 42, periods: [] },
    });

    await expect(getGoatOwnershipHistory(42)).resolves.toEqual({ goatId: 42, periods: [] });
    expect(requestBackEnd.get).toHaveBeenCalledWith("/goats/42/ownership-history");
  });

  it.each([0, -1, Number.MAX_SAFE_INTEGER + 1, 1.5])(
    "rejects invalid structural id %s before HTTP",
    async (goatId) => {
      await expect(getGoatOwnershipHistory(goatId)).rejects.toBeInstanceOf(InvalidGoatIdError);
      expect(requestBackEnd.get).not.toHaveBeenCalled();
    },
  );
});
