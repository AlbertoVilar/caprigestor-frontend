// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicGoatPage from "./PublicGoatPage";
import { fetchGoatById } from "../../api/GoatAPI/goat";

vi.mock("../../api/GoatAPI/goat", () => ({ fetchGoatById: vi.fn() }));

const mockedFetchGoat = vi.mocked(fetchGoatById);

describe("PublicGoatPage", () => {
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

  it("keeps genealogy contextual to the farm and registral animal", async () => {
    mockedFetchGoat.mockResolvedValue({
      farmId: 7,
      farmName: "Capril Teste",
      registrationNumber: "RG-42",
      name: "Estrela",
      breed: "SAANEN",
      color: "Branca",
      gender: "F",
      birthDate: "2020-01-01",
      status: "Ativo",
      category: "PO",
      tod: "TOD",
      toe: "42",
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/fazendas/7/animais/RG-42"]}>
          <Routes>
            <Route path="/fazendas/:farmId/animais/:goatId" element={<PublicGoatPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const genealogyLink = container.querySelector('a[href="/fazendas/7/animais/RG-42/genealogia"]');
    expect(genealogyLink?.textContent).toContain("Consultar genealogia");
    expect(mockedFetchGoat).toHaveBeenCalledWith(7, "RG-42");
  });
});
