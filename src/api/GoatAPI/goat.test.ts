import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { fetchGoatHerdSummary } from "./goat";

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
    expect(result.breeds).toEqual([
      { breed: "Saanen", count: 48 },
      { breed: "Boer", count: 32 },
      { breed: "Não informada", count: 3 },
    ]);
  });
});
