// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoatCreatePage from "./GoatCreatePage";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ tokenPayload: { userId: 1 } }),
}));

vi.mock("../../Components/goat-create-form/GoatCreateForm", () => ({
  default: ({ onGoatCreated }: { onGoatCreated: () => void }) => (
    <button type="button" onClick={onGoatCreated}>simulate create</button>
  ),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe("GoatCreatePage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("returns to the farm-scoped animal route after creation", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/goats/new?farmId=7&tod=TOD"]}>
          <Routes>
            <Route path="/goats/new" element={<GoatCreatePage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await act(async () => {
      (container.querySelector("button") as HTMLButtonElement).click();
    });

    expect(container.querySelector("[data-testid='location']")?.textContent).toBe("/cabras?farmId=7");
  });

  it("falls back to farms when no valid farm context exists", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/goats/new"]}>
          <Routes>
            <Route path="/goats/new" element={<GoatCreatePage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await act(async () => {
      (container.querySelector("button") as HTMLButtonElement).click();
    });

    expect(container.querySelector("[data-testid='location']")?.textContent).toBe("/fazendas");
  });
});
