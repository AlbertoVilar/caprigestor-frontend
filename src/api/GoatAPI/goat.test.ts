import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  exitGoat,
  fetchGoatHerdSummary,
  findGoatsByFarmAndName,
  findGoatsByFarmAndTerm,
  findGoatsByFarmIdPaginated,
} from "./goat";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("Goat API", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);
  const mockedPatch = vi.mocked(requestBackEnd.patch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the herd summary using the canonical route", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        total: 128,
        males: 19,
        females: 109,
        active: 117,
        inactive: 4,
        sold: 5,
        deceased: 2,
        breeds: [
          { breed: "Saanen", count: 48 },
          { breed: "Boer", count: 32 },
          { breed: null, count: 3 },
        ],
      },
    });

    const result = await fetchGoatHerdSummary(42);

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/42/goats/summary");
    expect(result.total).toBe(128);
    expect(result.females).toBe(109);
    expect(result.breeds[0]).toEqual({ breed: "Saanen", count: 48 });
    expect(result.breeds[1]).toEqual({ breed: "Boer", count: 32 });
    expect(result.breeds[2]?.count).toBe(3);
  });

  it("sends breed filter in paginated goat list request", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        content: [],
        number: 0,
        totalPages: 0,
        totalElements: 0,
        size: 12,
        first: true,
        last: true,
      },
    });

    await findGoatsByFarmIdPaginated(1, 0, 12, "SAANEN");

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/1/goats", {
      params: { page: 0, size: 12, breed: "SAANEN" },
    });
  });

  it("sends breed filter in goat name search request", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        content: [],
      },
    });

    await findGoatsByFarmAndName(1, "Topazio", "ALPINA");

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/1/goats/search", {
      params: { name: "Topazio", page: 0, size: 12, breed: "ALPINA" },
    });
  });

  it("falls back to an exact registration lookup when name search is empty", async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { content: [] } })
      .mockResolvedValueOnce({
        data: {
          registrationNumber: "1643218013",
          name: "PLUTÃO V DO CAPRIL VILAR",
          breed: "ALPINA",
          gender: "MACHO",
          status: "ATIVO",
          farmId: 1,
        },
      });

    const result = await findGoatsByFarmAndTerm(1, "1643218013", "ALPINA");

    expect(mockedGet).toHaveBeenNthCalledWith(1, "/goatfarms/1/goats/search", {
      params: { name: "1643218013", page: 0, size: 12, breed: "ALPINA" },
    });
    expect(mockedGet).toHaveBeenNthCalledWith(2, "/goatfarms/1/goats/1643218013");
    expect(result).toHaveLength(1);
    expect(result[0]?.registrationNumber).toBe("1643218013");
  });

  it("registers controlled goat exit using canonical route", async () => {
    mockedPatch.mockResolvedValueOnce({
      data: {
        goatId: "1001",
        exitType: "Venda",
        exitDate: "2026-03-16",
        notes: "Animal vendido para outro capril.",
        previousStatus: "ATIVO",
        currentStatus: "VENDIDO",
      },
    });

    const result = await exitGoat(1, "1001", {
      exitType: "VENDA",
      exitDate: "2026-03-16",
      notes: "Animal vendido para outro capril.",
    });

    expect(mockedPatch).toHaveBeenCalledWith("/goatfarms/1/goats/1001/exit", {
      exitType: "VENDA",
      exitDate: "2026-03-16",
      notes: "Animal vendido para outro capril.",
    });
    expect(result.currentStatus).toBe("VENDIDO");
  });
});
