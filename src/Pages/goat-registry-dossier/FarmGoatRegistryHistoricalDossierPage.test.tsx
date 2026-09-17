// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FarmGoatRegistryHistoricalDossierPage from "./FarmGoatRegistryHistoricalDossierPage";
import {
  getFarmGoatRegistryHistoricalDossierBasic,
  getFarmGoatRegistryHistoricalGenealogy,
} from "../../api/GoatOwnershipAPI/farmGoatRegistryHistoricalDossier";
import type {
  FarmGoatRegistryHistoricalDossierBasicDTO,
  FarmGoatRegistryHistoricalGenealogyDTO,
} from "../../Models/FarmGoatHistoricalDossierDTOs";

vi.mock("../../api/GoatOwnershipAPI/farmGoatRegistryHistoricalDossier", () => ({
  getFarmGoatRegistryHistoricalDossierBasic: vi.fn(),
  getFarmGoatRegistryHistoricalGenealogy: vi.fn(),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockedGetBasic = vi.mocked(getFarmGoatRegistryHistoricalDossierBasic);
const mockedGetGenealogy = vi.mocked(getFarmGoatRegistryHistoricalGenealogy);

const mockBasicDossier: FarmGoatRegistryHistoricalDossierBasicDTO = {
  goatId: 42,
  registrationNumber: "RG-042",
  name: "Estrela do Norte",
  globalStatus: "ATIVO",
  gender: "FEMEA",
  breed: "Anglo-Nubiana",
  color: "Castanha",
  birthDate: "2022-05-10",
  category: "CABRA",
  tod: "TD01",
  toe: "TE02",
  fatherName: "C.V.C SIGNOS PETROLEO",
  fatherRegistrationNumber: "1635717065",
  motherName: "NAIDE",
  motherRegistrationNumber: "2114517012",
  creatorFarmId: 10,
  creatorNameSnapshot: "Capril Vilar",
  roles: ["CREATOR", "CURRENT_OWNER"],
  disposition: "CURRENT",
  currentOwnerFarmId: 10,
};

const mockLocalGenealogy: FarmGoatRegistryHistoricalGenealogyDTO = {
  animalPrincipal: {
    relationship: "animalPrincipal",
    name: "Estrela do Norte",
    registrationNumber: "RG-042",
    source: "LOCAL",
    localTechnicalGoatId: 42,
  },
  pai: {
    relationship: "pai",
    name: "C.V.C SIGNOS PETROLEO",
    registrationNumber: "1635717065",
    source: "DECLARADO",
    localTechnicalGoatId: null,
  },
  mae: {
    relationship: "mae",
    name: "NAIDE",
    registrationNumber: "2114517012",
    source: "LOCAL",
    localTechnicalGoatId: 21,
  },
  avoPaterno: null,
  avoPaterna: null,
  avoMaterno: {
    relationship: "avoMaterno",
    name: "AVÔ MATERNO",
    registrationNumber: "RG-AVO-M",
    source: "ABCC",
    localTechnicalGoatId: null,
  },
  avoMaterna: null,
  bisavoPaternoPai: null,
  bisavoPaternaPai: null,
  bisavoPaternoMae: null,
  bisavoPaternaMae: null,
  bisavoMaternoPai: null,
  bisavoMaternaPai: null,
  bisavoMaternoMae: null,
  bisavoMaternaMae: null,
  integration: null,
};

describe("FarmGoatRegistryHistoricalDossierPage", () => {
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

  const renderComponent = async (farmId = "10", goatIdToken = "technical-42") => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/app/goatfarms/${farmId}/registry/${goatIdToken}`]}>
          <Routes>
            <Route
              path="/app/goatfarms/:farmId/registry/:goatIdToken"
              element={<FarmGoatRegistryHistoricalDossierPage />}
            />
          </Routes>
        </MemoryRouter>
      );
    });
  };

  it("renders loading state while fetching dossier", async () => {
    mockedGetBasic.mockReturnValueOnce(new Promise(() => {}));
    mockedGetGenealogy.mockReturnValueOnce(new Promise(() => {}));

    await renderComponent();
    expect(container.textContent).toContain("Carregando ficha histórica do registro...");
  });

  it("renders basic dossier and local genealogy using technical Goat identity and integration === null", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();

    expect(mockedGetBasic).toHaveBeenCalledWith(10, "technical-42");
    expect(mockedGetGenealogy).toHaveBeenCalledWith(10, "technical-42", false);

    expect(container.textContent).toContain("Estrela do Norte");
    expect(container.textContent).toContain("RG: RG-042");
    expect(container.textContent).toContain("Anglo-Nubiana");
    expect(container.textContent).toContain("Castanha");
    expect(container.textContent).toContain("TD01");
    expect(container.textContent).toContain("TE02");
    expect(container.textContent).toContain("Origem registral:");
    expect(container.textContent).toContain("Capril Vilar");
    expect(container.textContent).toContain("Fazenda proprietária atual:");
    expect(container.textContent).toContain("Esta fazenda");
    expect(container.textContent).toContain("Ficha Histórica Registrada (Somente Leitura)");
  });

  it("basicDossier_success_genealogyFailure_keepsDossierVisible", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockRejectedValueOnce(new Error("Network error loading genealogy"));

    await renderComponent();

    expect(container.textContent).toContain("Estrela do Norte");
    expect(container.textContent).toContain("RG: RG-042");
    expect(container.textContent).toContain("Não foi possível carregar a genealogia");
  });

  it("genealogyFailure_showsSectionErrorAndRetry", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockRejectedValueOnce(new Error("Service unavailable"));

    await renderComponent();

    expect(container.textContent).toContain("Não foi possível carregar a genealogia");
    const retryButtons = Array.from(container.querySelectorAll("button")).filter(
      (b) => b.textContent?.includes("Tentar novamente")
    );
    expect(retryButtons.length).toBeGreaterThan(0);
  });

  it("genealogyRetry_success_rendersTree", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockRejectedValueOnce(new Error("Transient error"));

    await renderComponent();
    expect(container.textContent).toContain("Não foi possível carregar a genealogia");

    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    const retryBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Tentar novamente")
    )!;

    await act(async () => {
      retryBtn.click();
    });

    expect(container.textContent).toContain("Árvore Genealógica Histórica");
    expect(container.textContent).toContain("C.V.C SIGNOS PETROLEO");
  });

  it("basicDossier404_remainsPageLevelNotFound", async () => {
    const error404 = { response: { status: 404 } };
    mockedGetBasic.mockRejectedValueOnce(error404);
    mockedGetGenealogy.mockRejectedValueOnce(error404);

    await renderComponent();

    expect(container.textContent).toContain("Animal não encontrado");
    expect(container.textContent).toContain(
      "O animal não foi encontrado no livro de registro desta fazenda."
    );
  });

  it("basicDossier403_remainsPageLevelForbidden", async () => {
    const error403 = { response: { status: 403 } };
    mockedGetBasic.mockRejectedValueOnce(error403);
    mockedGetGenealogy.mockRejectedValueOnce(error403);

    await renderComponent();

    expect(container.textContent).toContain("Acesso negado");
    expect(container.textContent).toContain(
      "Você não tem permissão para consultar a ficha histórica deste animal no registro da fazenda."
    );
  });

  it("noPublicFallback_whenHistoricalGenealogyFails", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockRejectedValueOnce(new Error("Genealogy fetch failed"));

    await renderComponent();

    expect(mockedGetBasic).toHaveBeenCalledTimes(1);
    expect(mockedGetGenealogy).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain("Public Animal Detail");
  });

  it("presents currentOwnerFarmId with establishment label 'Fazenda proprietária atual' and never as a person owner", async () => {
    const externalOwnerDossier: FarmGoatRegistryHistoricalDossierBasicDTO = {
      ...mockBasicDossier,
      currentOwnerFarmId: 99,
    };
    mockedGetBasic.mockResolvedValueOnce(externalOwnerDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();

    expect(container.textContent).toContain("Fazenda proprietária atual:");
    expect(container.textContent).toContain("Fazenda #99");
    expect(container.textContent).not.toContain("Proprietário Atual");
  });

  it("presents creatorNameSnapshot under neutral label 'Origem registral' and not as breeder person", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();

    expect(container.textContent).toContain("Origem registral:");
    expect(container.textContent).toContain("Capril Vilar");
    expect(container.textContent).not.toContain("Criador Registrado");
  });

  it("former owner farm sees current FARM reference without gaining mutation controls", async () => {
    const formerOwnerDossier: FarmGoatRegistryHistoricalDossierBasicDTO = {
      ...mockBasicDossier,
      roles: ["FORMER_OWNER"],
      disposition: "TRANSFERRED",
      currentOwnerFarmId: 88,
    };
    mockedGetBasic.mockResolvedValueOnce(formerOwnerDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();

    expect(container.textContent).toContain("Fazenda proprietária atual:");
    expect(container.textContent).toContain("Fazenda #88");
    expect(container.textContent).not.toContain("Editar");
    expect(container.textContent).not.toContain("Excluir");
    expect(container.textContent).not.toContain("Transferir");
    expect(container.textContent).not.toContain("Vender");
    expect(container.querySelector("form")).toBeNull();
  });

  it("rejects non-technical tokens (e.g. '42' or 'RG-123') as invalid parameters", async () => {
    await renderComponent("10", "42");
    expect(container.textContent).toContain("Parâmetros inválidos");

    await renderComponent("10", "RG-123");
    expect(container.textContent).toContain("Parâmetros inválidos");
  });

  it("renders disposition label for CURRENT", async () => {
    mockedGetBasic.mockResolvedValueOnce({ ...mockBasicDossier, disposition: "CURRENT" });
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();
    expect(container.textContent).toContain("No rebanho atual");
  });

  it("renders disposition label for TRANSFERRED", async () => {
    mockedGetBasic.mockResolvedValueOnce({ ...mockBasicDossier, disposition: "TRANSFERRED" });
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();
    expect(container.textContent).toContain("Transferido");
  });

  it("renders disposition label for SOLD", async () => {
    mockedGetBasic.mockResolvedValueOnce({ ...mockBasicDossier, disposition: "SOLD" });
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();
    expect(container.textContent).toContain("Vendido");
  });

  it("renders disposition label for NONE", async () => {
    mockedGetBasic.mockResolvedValueOnce({ ...mockBasicDossier, disposition: "NONE" });
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();
    expect(container.textContent).toContain("Sem vínculo de propriedade registrado");
  });

  it("sends complementaryAbcc=true when user requests ABCC complementation", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();

    const abccGenealogy: FarmGoatRegistryHistoricalGenealogyDTO = {
      ...mockLocalGenealogy,
      integration: {
        status: "FOUND",
        lookupKey: "registrationNumber",
        message: "Genealogia complementar ABCC carregada com sucesso.",
      },
    };
    mockedGetGenealogy.mockResolvedValueOnce(abccGenealogy);

    const abccBtn = container.querySelector(".dossier-abcc-btn") as HTMLButtonElement;
    expect(abccBtn).not.toBeNull();

    await act(async () => {
      abccBtn.click();
    });

    expect(mockedGetGenealogy).toHaveBeenCalledWith(10, "technical-42", true);
    expect(container.textContent).toContain("Genealogia complementar ABCC carregada com sucesso.");
  });

  it("keeps local tree visible when ABCC complementation fails with UNAVAILABLE", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);

    await renderComponent();

    mockedGetGenealogy.mockRejectedValueOnce(new Error("ABCC offline"));

    const abccBtn = container.querySelector(".dossier-abcc-btn") as HTMLButtonElement;
    await act(async () => {
      abccBtn.click();
    });

    expect(container.textContent).toContain(
      "Não foi possível consultar a ABCC no momento. Exibindo apenas a genealogia local."
    );
    expect(container.textContent).toContain("Estrela do Norte");
  });
});
