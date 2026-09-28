// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoatGenealogyViewPage from "./GoatGenealogyViewPage";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { getComplementaryGenealogyAbcc, getGenealogy } from "../../api/GenealogyAPI/genealogy";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";

vi.mock("../../api/GoatAPI/goat", () => ({ fetchGoatById: vi.fn() }));
vi.mock("../../api/GenealogyAPI/genealogy", () => ({
  getGenealogy: vi.fn(),
  getComplementaryGenealogyAbcc: vi.fn(),
}));
vi.mock("../../Components/goat-genealogy/GoatGenealogyTree", () => ({
  default: ({ data }: { data: GoatGenealogyDTO }) => (
    <div data-testid="genealogy-tree">{data.animalPrincipal.nome}</div>
  ),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockedFetchGoatById = vi.mocked(fetchGoatById);
const mockedGetGenealogy = vi.mocked(getGenealogy);
const mockedGetComplementary = vi.mocked(getComplementaryGenealogyAbcc);

const loadedGoat: GoatResponseDTO = {
  technicalId: 42,
  registrationNumber: "1643223003",
  name: "Zenda da Bocaina",
  breed: "Saanen",
  color: "Branca",
  gender: "Fêmea",
  birthDate: "2020-01-01",
  status: "Ativo",
  category: "PO",
  tod: "TOD",
  toe: "TOE",
  farmId: 14,
};

const genealogy = (name: string): GoatGenealogyDTO => ({
  animalPrincipal: {
    nome: name,
    registro: "1643223003",
    criador: "Capril Bocaina",
    proprietario: "Capril Bocaina",
    raca: "Saanen",
    pelagem: "Branca",
    situacao: "Ativo",
    sexo: "Fêmea",
    categoria: "PO",
    tod: "TOD",
    toe: "TOE",
    dataNasc: "2020-01-01",
    source: "LOCAL",
  },
  pai: undefined,
  mae: undefined,
  integration: undefined,
});

describe("GoatGenealogyViewPage identity boundary", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockedFetchGoatById.mockResolvedValue(loadedGoat);
    mockedGetGenealogy.mockResolvedValue(genealogy("Genealogia local"));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderRoute = async (entry: string) => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId/goats/:goatId/genealogy" element={<GoatGenealogyViewPage />} />
            <Route path="/fazendas/:farmId/animais/:goatId/genealogia" element={<GoatGenealogyViewPage />} />
          </Routes>
        </MemoryRouter>
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  it("resolves a private technical route before querying genealogy with the registration", async () => {
    await renderRoute("/app/goatfarms/14/goats/technical-42/genealogy");

    expect(mockedFetchGoatById).toHaveBeenCalledWith(14, "technical-42");
    expect(mockedGetGenealogy).toHaveBeenCalledWith(14, "1643223003");
    expect(mockedGetGenealogy).not.toHaveBeenCalledWith(14, "technical-42");

    mockedGetComplementary.mockResolvedValueOnce(genealogy("Genealogia ABCC"));
    await act(async () => {
      container.querySelector("button:nth-of-type(2)")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedGetComplementary).toHaveBeenCalledWith(14, "1643223003");
    expect(mockedGetComplementary).not.toHaveBeenCalledWith(14, "technical-42");
  });

  it("keeps public registration routes compatible", async () => {
    await renderRoute("/fazendas/14/animais/1643223003/genealogia");

    expect(mockedFetchGoatById).toHaveBeenCalledWith(14, "1643223003");
    expect(mockedGetGenealogy).toHaveBeenCalledWith(14, "1643223003");
  });

  it("preserves local genealogy and reports an ABCC failure", async () => {
    await renderRoute("/app/goatfarms/14/goats/technical-42/genealogy");
    expect(container.querySelector('[data-testid="genealogy-tree"]')?.textContent).toContain("local");

    mockedGetComplementary.mockRejectedValueOnce(new Error("ABCC unavailable"));
    await act(async () => {
      container.querySelector("button:nth-of-type(2)")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector('[data-testid="genealogy-tree"]')?.textContent).toContain("local");
    expect(container.textContent).toContain("A genealogia local continua exibida");
  });

  it("replaces local genealogy with the complementary ABCC response", async () => {
    await renderRoute("/app/goatfarms/14/goats/technical-42/genealogy");
    mockedGetComplementary.mockResolvedValueOnce(genealogy("Genealogia ABCC"));

    await act(async () => {
      container.querySelector("button:nth-of-type(2)")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector('[data-testid="genealogy-tree"]')?.textContent).toContain("ABCC");
    expect(container.textContent).toContain("Complementar ABCC");
  });
});
