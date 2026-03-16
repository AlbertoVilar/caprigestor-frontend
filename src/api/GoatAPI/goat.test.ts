import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  fetchGoatHerdSummary,
  findGoatsByFarmAndName,
  findGoatsByFarmIdPaginated,
} from "./goat";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
  },
}));

describe("Goat API", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);

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
});
