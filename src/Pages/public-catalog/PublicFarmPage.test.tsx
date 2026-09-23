// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicFarmPage from "./PublicFarmPage";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";

vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({ getGoatFarmById: vi.fn() }));
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: false, tokenPayload: null }),
}));

const mockedGetFarm = vi.mocked(getGoatFarmById);

function LocationProbe() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return <div data-testid="location">{`${location.pathname}|${from ?? ""}`}</div>;
}

describe("PublicFarmPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockedGetFarm.mockResolvedValue({
      id: 7,
      name: "Capril Teste",
      city: "Juazeirinho",
      state: "PB",
      userName: "Owner",
      userEmail: "owner@example.com",
      phones: [],
    } as never);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    mockedGetFarm.mockReset();
  });

  it("carries the farm dashboard destination from Área do proprietário to login", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/fazendas/7"]}>
          <Routes>
            <Route path="/fazendas/:farmId" element={<PublicFarmPage />} />
            <Route path="/login" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const ownerLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent?.trim() === "Área do proprietário"
    ) as HTMLAnchorElement;
    expect(ownerLink).toBeTruthy();

    await act(async () => {
      ownerLink.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    });

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe(
      "/login|/app/goatfarms/7/dashboard"
    );
    expect(mockedGetFarm).toHaveBeenCalledWith(7);
  });
});
