// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoatListPage from "./GoatListPage";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import {
  fetchGoatHerdSummary,
  findGoatsByFarmIdPaginated,
} from "../../api/GoatAPI/goat";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: false, tokenPayload: null }),
}));

vi.mock("../../Hooks/useFarmPermissions", () => ({
  useFarmPermissions: () => ({ canOperateFarm: false, loading: false }),
}));

vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({
  getGoatFarmById: vi.fn(),
}));

vi.mock("../../api/GoatAPI/goat", async () => {
  const actual = await vi.importActual<typeof import("../../api/GoatAPI/goat")>("../../api/GoatAPI/goat");
  return {
    ...actual,
    fetchGoatById: vi.fn(),
    fetchGoatHerdSummary: vi.fn(),
    findGoatsByFarmAndTerm: vi.fn(),
    findGoatsByFarmIdPaginated: vi.fn(),
  };
});

const mockedGetFarm = vi.mocked(getGoatFarmById);
const mockedSummary = vi.mocked(fetchGoatHerdSummary);
const mockedPage = vi.mocked(findGoatsByFarmIdPaginated);

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("GoatListPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders an explicit farm context state without fetching a global herd", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/cabras"]}>
          <Routes>
            <Route path="/cabras" element={<GoatListPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain("Escolha uma fazenda para consultar os animais.");
    expect(container.querySelector('a[href="/fazendas"]')?.textContent).toContain("Ver fazendas");
    expect(mockedGetFarm).not.toHaveBeenCalled();
    expect(mockedPage).not.toHaveBeenCalled();
    expect(mockedSummary).not.toHaveBeenCalled();
  });

  it("preserves the farm-scoped herd flow when farmId is present", async () => {
    mockedGetFarm.mockResolvedValue({ id: 7, name: "Capril Teste", tod: "TOD", userId: 1 } as never);
    mockedPage.mockResolvedValue({
      content: [], number: 0, totalPages: 0, totalElements: 0, size: 12, first: true, last: true,
    });
    mockedSummary.mockResolvedValue({ total: 0, males: 0, females: 0, active: 0, inactive: 0, sold: 0, deceased: 0, breeds: [] });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/cabras?farmId=7"]}>
          <Routes>
            <Route path="/cabras" element={<GoatListPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(mockedGetFarm).toHaveBeenCalledWith(7);
    expect(mockedPage).toHaveBeenCalledWith(7, 0, 12, undefined);
    expect(container.textContent).toContain("Animais da fazenda");
  });
});
