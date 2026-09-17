// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FarmGoatRegistryPage from "./FarmGoatRegistryPage";
import { getFarmGoatRegistry } from "../../api/GoatOwnershipAPI/farmGoatRegistry";
import type { FarmGoatRegistryResponseDTO } from "../../Models/FarmGoatRegistryDTOs";

vi.mock("../../api/GoatOwnershipAPI/farmGoatRegistry", () => ({
  getFarmGoatRegistry: vi.fn(),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

const mockedGetRegistry = vi.mocked(getFarmGoatRegistry);

const item1CurrentAndCreator: FarmGoatRegistryResponseDTO = {
  goatId: 42,
  registrationNumber: "RG-042",
  name: "Estrela do Norte",
  globalStatus: "ATIVO",
  creatorFarmId: 7,
  creatorNameSnapshot: "Capril Vilar",
  roles: ["CREATOR", "CURRENT_OWNER"],
  disposition: "CURRENT",
  currentOwnerFarmId: 7,
};

const item2FormerOwnerSold: FarmGoatRegistryResponseDTO = {
  goatId: 101,
  registrationNumber: "RG-101",
  name: "Bella Vista",
  globalStatus: "ATIVO",
  creatorFarmId: 7,
  creatorNameSnapshot: "Capril Vilar",
  roles: ["CREATOR", "FORMER_OWNER"],
  disposition: "SOLD",
  currentOwnerFarmId: 99,
};

const item3CreatorOnly: FarmGoatRegistryResponseDTO = {
  goatId: 202,
  registrationNumber: "RG-202",
  name: "Princesa",
  globalStatus: "INATIVO",
  creatorFarmId: 7,
  creatorNameSnapshot: null,
  roles: ["CREATOR"],
  disposition: "NONE",
  currentOwnerFarmId: null,
};

const item4FormerOwnerDeceased: FarmGoatRegistryResponseDTO = {
  goatId: 303,
  registrationNumber: "RG-303",
  name: "Trovão",
  globalStatus: "FALECIDO",
  creatorFarmId: 15,
  creatorNameSnapshot: "Fazenda Sol",
  roles: ["FORMER_OWNER"],
  disposition: "DECEASED",
  currentOwnerFarmId: null,
};

const item5FormerOwnerRetired: FarmGoatRegistryResponseDTO = {
  goatId: 404,
  registrationNumber: "RG-404",
  name: "Soneca",
  globalStatus: "INATIVO",
  creatorFarmId: 7,
  creatorNameSnapshot: "Capril Vilar",
  roles: ["FORMER_OWNER"],
  disposition: "RETIRED",
  currentOwnerFarmId: 12,
};

describe("FarmGoatRegistryPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const renderComponent = async (farmId = "7") => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/app/goatfarms/${farmId}/registry`]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId/registry" element={<FarmGoatRegistryPage />} />
          </Routes>
        </MemoryRouter>
      );
    });
  };

  it("renders loading state while fetching registry", async () => {
    let pendingResolve: (value: FarmGoatRegistryResponseDTO[]) => void = () => {};
    mockedGetRegistry.mockReturnValueOnce(
      new Promise((resolve) => {
        pendingResolve = resolve;
      })
    );

    await renderComponent();
    expect(container.textContent).toContain("Carregando livro de registro da fazenda...");

    await act(async () => {
      pendingResolve([item1CurrentAndCreator]);
    });

    expect(container.textContent).toContain("Estrela do Norte");
  });

  it("renders empty state when registry has no items", async () => {
    mockedGetRegistry.mockResolvedValueOnce([]);
    await renderComponent();

    expect(container.textContent).toContain("Nenhum registro encontrado");
    expect(container.textContent).toContain("Nenhum animal possui vínculo registrado com esta fazenda.");
  });

  it("renders generic API error state and retries", async () => {
    mockedGetRegistry.mockRejectedValueOnce(new Error("Erro de conexão"));
    await renderComponent();

    expect(container.textContent).toContain("Não foi possível carregar o livro de registro");
    expect(container.textContent).toContain("Erro de conexão");

    mockedGetRegistry.mockResolvedValueOnce([item1CurrentAndCreator]);
    const retryBtn = container.querySelector("button.gf-button") as HTMLButtonElement;
    expect(retryBtn).not.toBeNull();

    await act(async () => {
      retryBtn.click();
    });

    expect(container.textContent).toContain("Estrela do Norte");
  });

  it("handles 403 as access denied", async () => {
    const error403 = { response: { status: 403, data: { message: "Acesso proibido" } } };
    mockedGetRegistry.mockRejectedValueOnce(error403);
    await renderComponent();

    expect(container.textContent).toContain("Acesso negado");
    expect(container.textContent).toContain(
      "Você não tem permissão para consultar o livro de registro desta fazenda."
    );
    // No retry button on 403
    expect(container.querySelector("button.gf-button")).toBeNull();
  });

  it("renders error state when route farmId is invalid", async () => {
    await renderComponent("invalid-id");
    expect(container.textContent).toContain("Identificador inválido");
    expect(mockedGetRegistry).not.toHaveBeenCalled();
  });

  it("renders Rebanho atual view by default (roles include CURRENT_OWNER)", async () => {
    mockedGetRegistry.mockResolvedValueOnce([
      item1CurrentAndCreator,
      item2FormerOwnerSold,
      item3CreatorOnly,
      item4FormerOwnerDeceased,
    ]);
    await renderComponent();

    const tabRebanho = container.querySelector("#tab-REBANHO_ATUAL");
    expect(tabRebanho?.getAttribute("aria-selected")).toBe("true");

    expect(container.textContent).toContain("Estrela do Norte");
    expect(container.textContent).not.toContain("Bella Vista");
    expect(container.textContent).not.toContain("Princesa");
    expect(container.textContent).not.toContain("Trovão");
  });

  it("switches to Criatório view (roles include CREATOR)", async () => {
    mockedGetRegistry.mockResolvedValueOnce([
      item1CurrentAndCreator,
      item2FormerOwnerSold,
      item3CreatorOnly,
      item4FormerOwnerDeceased,
    ]);
    await renderComponent();

    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });

    expect(tabCriatorio.getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("Estrela do Norte");
    expect(container.textContent).toContain("Bella Vista");
    expect(container.textContent).toContain("Princesa");
    expect(container.textContent).not.toContain("Trovão");
  });

  it("switches to Histórico view (roles include CURRENT_OWNER or FORMER_OWNER)", async () => {
    mockedGetRegistry.mockResolvedValueOnce([
      item1CurrentAndCreator,
      item2FormerOwnerSold,
      item3CreatorOnly,
      item4FormerOwnerDeceased,
    ]);
    await renderComponent();

    const tabHistorico = container.querySelector("#tab-HISTORICO") as HTMLButtonElement;
    await act(async () => {
      tabHistorico.click();
    });

    expect(tabHistorico.getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("Estrela do Norte");
    expect(container.textContent).toContain("Bella Vista");
    expect(container.textContent).not.toContain("Princesa"); // creator-only, no ownership period
    expect(container.textContent).toContain("Trovão");
  });

  it("multi-role Goat appears in every applicable view", async () => {
    mockedGetRegistry.mockResolvedValueOnce([item1CurrentAndCreator]);
    await renderComponent();

    // Rebanho atual
    expect(container.textContent).toContain("Estrela do Norte");

    // Criatório
    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });
    expect(container.textContent).toContain("Estrela do Norte");

    // Histórico
    const tabHistorico = container.querySelector("#tab-HISTORICO") as HTMLButtonElement;
    await act(async () => {
      tabHistorico.click();
    });
    expect(container.textContent).toContain("Estrela do Norte");
  });

  it("deduplicates identical goatId within one view keeping first occurrence", async () => {
    const duplicateItem1: FarmGoatRegistryResponseDTO = {
      ...item1CurrentAndCreator,
      name: "Estrela Duplicada Ignorada",
    };

    mockedGetRegistry.mockResolvedValueOnce([item1CurrentAndCreator, duplicateItem1]);
    await renderComponent();

    const rows = container.querySelectorAll("tr.farm-goat-registry-row");
    expect(rows.length).toBe(1);
    expect(container.textContent).toContain("Estrela do Norte");
    expect(container.textContent).not.toContain("Estrela Duplicada Ignorada");
  });

  it("filters by name search within active view", async () => {
    mockedGetRegistry.mockResolvedValueOnce([
      item1CurrentAndCreator,
      item2FormerOwnerSold,
      item3CreatorOnly,
    ]);
    await renderComponent();

    // Switch to Criatório (which has Estrela, Bella, Princesa)
    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });

    const searchInput = container.querySelector("input[type='search']") as HTMLInputElement;
    await act(async () => {
      setInputValue(searchInput, "bella");
    });

    expect(container.textContent).toContain("Bella Vista");
    expect(container.textContent).not.toContain("Estrela do Norte");
    expect(container.textContent).not.toContain("Princesa");
  });

  it("filters by registrationNumber search within active view", async () => {
    mockedGetRegistry.mockResolvedValueOnce([
      item1CurrentAndCreator,
      item2FormerOwnerSold,
      item3CreatorOnly,
    ]);
    await renderComponent();

    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });

    const searchInput = container.querySelector("input[type='search']") as HTMLInputElement;
    await act(async () => {
      setInputValue(searchInput, "RG-202");
    });

    expect(container.textContent).toContain("Princesa");
    expect(container.textContent).not.toContain("Estrela do Norte");
    expect(container.textContent).not.toContain("Bella Vista");
  });

  it("renders frozen Portuguese disposition labels including Retirado and Sem vínculo de propriedade registrado", async () => {
    mockedGetRegistry.mockResolvedValueOnce([
      item1CurrentAndCreator,  // CURRENT -> No rebanho atual
      item2FormerOwnerSold,    // SOLD -> Vendido, globalStatus: ATIVO
      item3CreatorOnly,        // NONE -> Sem vínculo de propriedade registrado
      item5FormerOwnerRetired, // RETIRED -> Retirado
    ]);
    await renderComponent();

    // Rebanho atual view
    expect(container.textContent).toContain("No rebanho atual");
    expect(container.textContent).toContain("Estado global:");
    expect(container.textContent).toContain("Relação com esta fazenda:");
    expect(container.textContent).toContain("Ativo");

    // Switch to Criatório to see SOLD and Sem vínculo de propriedade registrado
    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });

    expect(container.textContent).toContain("Vendido");
    expect(container.textContent).toContain("Sem vínculo de propriedade registrado");

    // Switch to Histórico to see Retirado
    const tabHistorico = container.querySelector("#tab-HISTORICO") as HTMLButtonElement;
    await act(async () => {
      tabHistorico.click();
    });

    expect(container.textContent).toContain("Retirado");
  });

  it("renders 'Esta fazenda' and never 'Fazenda atual (você)' when currentOwnerFarmId matches routeFarmId", async () => {
    mockedGetRegistry.mockResolvedValueOnce([item1CurrentAndCreator]);
    await renderComponent();

    expect(container.textContent).toContain("Esta fazenda");
    expect(container.textContent).not.toContain("Fazenda atual (você)");
    expect(container.textContent).not.toContain("(você)");
  });

  it("CURRENT_OWNER item exposes operational link with technical token /app/goatfarms/7/goats/technical-42", async () => {
    mockedGetRegistry.mockResolvedValueOnce([item1CurrentAndCreator]);
    await renderComponent();

    const link = container.querySelector("a.farm-goat-registry-action-link") as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("/app/goatfarms/7/goats/technical-42");
    expect(link.getAttribute("aria-label")).toBe("Gerenciar animal Estrela do Norte");
  });

  it("FORMER_OWNER without CURRENT_OWNER renders read-only without private operational link", async () => {
    mockedGetRegistry.mockResolvedValueOnce([item2FormerOwnerSold]);
    await renderComponent();

    // Switch to Histórico to view Bella Vista
    const tabHistorico = container.querySelector("#tab-HISTORICO") as HTMLButtonElement;
    await act(async () => {
      tabHistorico.click();
    });

    expect(container.textContent).toContain("Bella Vista");
    expect(container.querySelector("a.farm-goat-registry-action-link")).toBeNull();
    expect(container.textContent).toContain("Somente leitura");
  });

  it("CREATOR-only renders read-only without private operational link", async () => {
    mockedGetRegistry.mockResolvedValueOnce([item3CreatorOnly]);
    await renderComponent();

    // Switch to Criatório
    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });

    expect(container.textContent).toContain("Princesa");
    expect(container.querySelector("a.farm-goat-registry-action-link")).toBeNull();
    expect(container.textContent).toContain("Somente leitura");
  });

  it("handles null creatorNameSnapshot truthfully", async () => {
    mockedGetRegistry.mockResolvedValueOnce([item3CreatorOnly]);
    await renderComponent();

    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });

    expect(container.textContent).toContain("Não informado");
    expect(container.textContent).toContain("Criado nesta fazenda");
  });

  it("displays external currentOwnerFarmId truthfully as Fazenda #99", async () => {
    mockedGetRegistry.mockResolvedValueOnce([item2FormerOwnerSold]);
    await renderComponent();

    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });

    expect(container.textContent).toContain("Fazenda #99");
  });

  it("displays null currentOwnerFarmId truthfully as Sem propriedade atual registrada no CapriGestor", async () => {
    mockedGetRegistry.mockResolvedValueOnce([item3CreatorOnly]);
    await renderComponent();

    const tabCriatorio = container.querySelector("#tab-CRIATORIO") as HTMLButtonElement;
    await act(async () => {
      tabCriatorio.click();
    });

    expect(container.textContent).toContain("Sem propriedade atual registrada no CapriGestor");
  });
});
