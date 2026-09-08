import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { getFarmPermissions } from "./goatFarm";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
  },
}));

describe("Farm permissions API", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("reads farm-scoped capabilities from the backend policy endpoint", async () => {
    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({
      data: { canOperateFarm: true, canAdministerFarm: false },
    });

    await expect(getFarmPermissions(42)).resolves.toEqual({
      canOperateFarm: true,
      canAdministerFarm: false,
    });
    expect(requestBackEnd.get).toHaveBeenCalledWith("/goatfarms/42/permissions");
  });
});
