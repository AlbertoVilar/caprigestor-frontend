import { beforeEach, describe, expect, it, vi } from "vitest";
import { getComplementaryGenealogyAbcc, getGenealogy } from "./genealogy";
import { requestBackEnd } from "../../utils/request";

vi.mock("../../utils/request", () => ({
  requestBackEnd: vi.fn(),
}));

const mockedRequest = vi.mocked(requestBackEnd);

const responseData = {
  animalPrincipal: { nome: "ORLEANS", registro: "1643219011" },
  pai: null,
  mae: null,
};

describe("Genealogy API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequest.mockResolvedValue({ data: responseData } as never);
  });

  it("uses a bounded extended timeout only for complementary ABCC genealogy", async () => {
    await getComplementaryGenealogyAbcc(1, "1643219011");

    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/goatfarms/1/goats/1643219011/genealogies?complementaryAbcc=true",
      method: "GET",
      timeout: 30000,
    });
  });

  it("keeps ordinary genealogy on the global client timeout", async () => {
    await getGenealogy(1, "1643219011");

    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/goatfarms/1/goats/1643219011/genealogies",
      method: "GET",
    });
  });

  it("preserves request failures for the existing fallback handling", async () => {
    const failure = new Error("ABCC unavailable");
    mockedRequest.mockRejectedValueOnce(failure);

    await expect(getComplementaryGenealogyAbcc(1, "1643219011")).rejects.toBe(failure);
  });
});
