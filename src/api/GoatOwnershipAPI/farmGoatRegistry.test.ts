import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  getFarmGoatRegistry,
  InvalidFarmIdError,
} from "./farmGoatRegistry";
import type { FarmGoatRegistryResponseDTO } from "../../Models/FarmGoatRegistryDTOs";

vi.mock("../../utils/request", () => ({
  requestBackEnd: { get: vi.fn() },
}));

describe("Farm goat registry API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests registry using a positive safe integer farmId and returns raw array", async () => {
    const mockRegistry: FarmGoatRegistryResponseDTO[] = [
      {
        goatId: 42,
        registrationNumber: "RG42",
        name: "Estrela",
        globalStatus: "ATIVO",
        creatorFarmId: 1,
        creatorNameSnapshot: "Capril A",
        roles: ["CREATOR", "CURRENT_OWNER"],
        disposition: "CURRENT",
        currentOwnerFarmId: 1,
      },
    ];
    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({
      data: mockRegistry,
    });

    const result = await getFarmGoatRegistry(1);
    expect(result).toEqual(mockRegistry);
    expect(requestBackEnd.get).toHaveBeenCalledWith("/goatfarms/1/goat-registry");
  });

  it.each([
    0,
    -1,
    -42,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid farmId %s before HTTP request", async (farmId) => {
    await expect(getFarmGoatRegistry(farmId)).rejects.toBeInstanceOf(InvalidFarmIdError);
    expect(requestBackEnd.get).not.toHaveBeenCalled();
  });
});
