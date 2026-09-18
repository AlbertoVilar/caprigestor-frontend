// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FarmGoatRegistryHistoricalDossierPage from "./FarmGoatRegistryHistoricalDossierPage";
import {
  getFarmGoatRegistryHistoricalDossierBasic,
  getFarmGoatRegistryHistoricalGenealogy,
  getFarmGoatRegistryHistoricalMilkLactation,
  getFarmGoatRegistryHistoricalReproduction,
} from "../../api/GoatOwnershipAPI/farmGoatRegistryHistoricalDossier";
import type {
  FarmGoatHistoricalMilkLactationResponseDTO,
  FarmGoatHistoricalReproductionResponseDTO,
  FarmGoatRegistryHistoricalDossierBasicDTO,
  FarmGoatRegistryHistoricalGenealogyDTO,
} from "../../Models/FarmGoatHistoricalDossierDTOs";

vi.mock("../../api/GoatOwnershipAPI/farmGoatRegistryHistoricalDossier", () => ({
  getFarmGoatRegistryHistoricalDossierBasic: vi.fn(),
  getFarmGoatRegistryHistoricalGenealogy: vi.fn(),
  getFarmGoatRegistryHistoricalMilkLactation: vi.fn(),
  getFarmGoatRegistryHistoricalReproduction: vi.fn(),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockedGetBasic = vi.mocked(getFarmGoatRegistryHistoricalDossierBasic);
const mockedGetGenealogy = vi.mocked(getFarmGoatRegistryHistoricalGenealogy);
const mockedGetMilkLactation = vi.mocked(getFarmGoatRegistryHistoricalMilkLactation);
const mockedGetReproduction = vi.mocked(getFarmGoatRegistryHistoricalReproduction);

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

const mockMilkLactationData: FarmGoatHistoricalMilkLactationResponseDTO = {
  goatId: 42,
  lactations: [
    {
      id: 1,
      goatId: 42,
      farmId: 10,
      status: "ACTIVE",
      startDate: "2024-01-01",
      endDate: null,
      pregnancyStartDate: null,
      dryStartDate: null,
      dryAtPregnancyDays: 90,
      restDays: 60,
      active: true,
    },
    {
      id: 2,
      goatId: 42,
      farmId: 5,
      status: "CLOSED",
      startDate: "2023-01-01",
      endDate: "2023-10-01",
      pregnancyStartDate: null,
      dryStartDate: null,
      dryAtPregnancyDays: 90,
      restDays: 60,
      active: false,
    },
  ],
  milkProductions: [
    {
      id: 101,
      goatId: 42,
      lactationId: 1,
      farmId: 10,
      date: "2024-02-01",
      shift: "MORNING",
      volumeLiters: 4.5,
      status: "ACTIVE",
      notes: "Produção alta",
      canceledAt: null,
      canceledReason: null,
      recordedDuringMilkWithdrawal: true,
      milkWithdrawalEventId: 12,
      milkWithdrawalEndDate: "2024-02-05",
      milkWithdrawalSource: "Antibiótico",
    },
    {
      id: 102,
      goatId: 42,
      lactationId: 1,
      farmId: 10,
      date: "2024-02-02",
      shift: "AFTERNOON",
      volumeLiters: 1.5,
      status: "CANCELED",
      notes: null,
      canceledAt: "2024-02-02T18:00:00Z",
      canceledReason: "Erro de medição",
      recordedDuringMilkWithdrawal: false,
      milkWithdrawalEventId: null,
      milkWithdrawalEndDate: null,
      milkWithdrawalSource: null,
    },
  ],
};

const mockReproductionData: FarmGoatHistoricalReproductionResponseDTO = {
  goatId: 42,
  processes: [
    {
      pregnancyId: 101,
      processOriginFarmId: 10,
      breedingDate: "2024-01-10",
      confirmDate: "2024-02-15",
      expectedDueDate: "2024-06-09",
      coverageEventId: 201,
      status: "CONFIRMED",
      closedAt: null,
      closeReason: null,
      foreignCoverageContext: null,
    },
    {
      pregnancyId: 102,
      processOriginFarmId: 10,
      breedingDate: "2023-01-10",
      confirmDate: "2023-02-15",
      expectedDueDate: "2023-06-09",
      coverageEventId: 202,
      status: "CLOSED",
      closedAt: "2023-06-10",
      closeReason: "BIRTH",
      foreignCoverageContext: null,
    },
    {
      pregnancyId: 103,
      processOriginFarmId: null,
      breedingDate: "2022-01-10",
      confirmDate: null,
      expectedDueDate: null,
      coverageEventId: null,
      status: null,
      closedAt: null,
      closeReason: null,
      foreignCoverageContext: {
        coverageEventId: 88,
        originFarmId: 99,
        coverageDate: "2022-01-10",
        breedingType: "NATURAL",
        breederRef: "BODE-ORIGEM-99",
      },
    },
  ],
  events: [
    {
      id: 501,
      farmId: 10,
      eventType: "COVERAGE",
      eventDate: "2024-01-10",
      breedingType: "NATURAL",
      breederRef: "BOD-44",
      pregnancyId: 101,
      relatedEventId: null,
      correctedEventDate: null,
      checkScheduledDate: null,
      checkResult: null,
      notes: "Cobertura normal",
    },
    {
      id: 502,
      farmId: 10,
      eventType: "COVERAGE_CORRECTION",
      eventDate: "2024-01-11",
      breedingType: "AI",
      breederRef: "SEMEN-123",
      pregnancyId: 101,
      relatedEventId: 501,
      correctedEventDate: "2024-01-10",
      checkScheduledDate: null,
      checkResult: null,
      notes: "Ajuste de reprodutor",
    },
    {
      id: 503,
      farmId: 10,
      eventType: "PREGNANCY_CHECK",
      eventDate: "2024-02-15",
      breedingType: null,
      breederRef: null,
      pregnancyId: null,
      relatedEventId: null,
      correctedEventDate: null,
      checkScheduledDate: "2024-02-15",
      checkResult: "NEGATIVE",
      notes: "Primeiro toque negativo",
    },
    {
      id: 504,
      farmId: 10,
      eventType: "PREGNANCY_CHECK",
      eventDate: "2024-02-25",
      breedingType: null,
      breederRef: null,
      pregnancyId: null,
      relatedEventId: null,
      correctedEventDate: null,
      checkScheduledDate: "2024-02-25",
      checkResult: "POSITIVE",
      notes: "Segundo toque confirmado",
    },
    {
      id: 505,
      farmId: 10,
      eventType: "PREGNANCY_CLOSE",
      eventDate: "2023-06-10",
      breedingType: null,
      breederRef: null,
      pregnancyId: 102,
      relatedEventId: null,
      correctedEventDate: null,
      checkScheduledDate: null,
      checkResult: null,
      notes: "Parto duplo sem complicações",
    },
    {
      id: 506,
      farmId: 10,
      eventType: "WEANING",
      eventDate: "2023-08-10",
      breedingType: null,
      breederRef: null,
      pregnancyId: null,
      relatedEventId: null,
      correctedEventDate: null,
      checkScheduledDate: null,
      checkResult: null,
      notes: "Desmame aos 60 dias",
    },
  ],
};

describe("FarmGoatRegistryHistoricalDossierPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetMilkLactation.mockResolvedValue({ goatId: 42, lactations: [], milkProductions: [] });
    mockedGetReproduction.mockResolvedValue({ goatId: 42, processes: [], events: [] });
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

  it("renders Card E with lactations, milk productions, and computed KPIs", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
    mockedGetMilkLactation.mockResolvedValueOnce(mockMilkLactationData);

    await renderComponent();

    expect(mockedGetMilkLactation).toHaveBeenCalledWith(10, "technical-42");

    // Check title and description
    expect(container.textContent).toContain("Lactações & Produção de Leite");
    expect(container.textContent).toContain("Histórico de lactações relacionadas à fazenda e ordenhas registradas nela");

    // Check KPIs
    // 4.5L active + 1.5L canceled = only 4.50 L counted in total
    expect(container.textContent).toContain("4.50 L");
    expect(container.textContent).toContain("Total de Leite Registrado");
    expect(container.textContent).toContain("Registros de Ordenha");

    // Check Lactations
    expect(container.textContent).toContain("Lactações Registradas (2)");
    expect(container.textContent).toContain("Iniciada nesta fazenda");
    expect(container.textContent).toContain("Iniciada na Fazenda #5");
    expect(container.textContent).not.toContain("Herdada na transferência");
    expect(container.textContent).toContain("Secagem");
    expect(container.textContent).not.toContain("d. gest.");

    // Check Productions
    expect(container.textContent).toContain("Registros de Ordenha (2)");
    expect(container.textContent).toContain("4.50 L");
    expect(container.textContent).toContain("1.50 L");
    expect(container.textContent).toContain("Carência");
    expect(container.textContent).toContain("Erro de medição");
  });

  it("renders empty state when lactations and productions are empty", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
    mockedGetMilkLactation.mockResolvedValueOnce({
      goatId: 42,
      lactations: [],
      milkProductions: [],
    });

    await renderComponent();

    expect(container.textContent).toContain("Sem registros produtivos");
    expect(container.textContent).toContain(
      "Nenhum registro histórico de lactação ou ordenha vinculado a esta fazenda."
    );
  });

  it("failure isolation: milkLactation fails, basic dossier and genealogy remain visible", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
    mockedGetMilkLactation.mockRejectedValueOnce(new Error("Milk lactation service unavailable"));

    await renderComponent();

    // Basic dossier remains intact
    expect(container.textContent).toContain("Estrela do Norte");
    expect(container.textContent).toContain("RG: RG-042");

    // Genealogy remains intact
    expect(container.textContent).toContain("Árvore Genealógica Histórica");

    // Milk lactation section shows isolated error state with retry
    expect(container.textContent).toContain("Não foi possível carregar os dados de leite e lactação");
    const retryButtons = Array.from(container.querySelectorAll("button")).filter(
      (b) => b.textContent?.includes("Tentar novamente")
    );
    expect(retryButtons.length).toBeGreaterThan(0);
  });

  it("milkLactation retry reloads and displays data successfully", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
    mockedGetMilkLactation.mockRejectedValueOnce(new Error("Transient failure"));

    await renderComponent();
    expect(container.textContent).toContain("Não foi possível carregar os dados de leite e lactação");

    mockedGetMilkLactation.mockResolvedValueOnce(mockMilkLactationData);

    const retryBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Tentar novamente")
    )!;

    await act(async () => {
      retryBtn.click();
    });

    expect(container.textContent).toContain("4.50 L");
    expect(container.textContent).toContain("Lactações Registradas (2)");
  });

  it("displays actual dryStartDate when present, and '-' when absent without gestational config fallback", async () => {
    mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
    mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
    mockedGetMilkLactation.mockResolvedValueOnce({
      goatId: 42,
      lactations: [
        {
          id: 10,
          goatId: 42,
          farmId: 10,
          status: "CLOSED",
          startDate: "2023-01-01",
          endDate: "2023-10-01",
          pregnancyStartDate: null,
          dryStartDate: "2023-09-15",
          dryAtPregnancyDays: 90,
          restDays: 60,
          active: false,
        },
        {
          id: 11,
          goatId: 42,
          farmId: 10,
          status: "ACTIVE",
          startDate: "2024-01-01",
          endDate: null,
          pregnancyStartDate: null,
          dryStartDate: null,
          dryAtPregnancyDays: 90,
          restDays: 60,
          active: true,
        },
      ],
      milkProductions: [],
    });

    await renderComponent();

    expect(container.textContent).toContain("2023-09-15");
    expect(container.textContent).not.toContain("90 d. gest.");
  });

  describe("Historical Reproduction Section", () => {
    it("Case A: renders reproductive processes with their safe fields and provenance", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      expect(container.textContent).toContain("Processos e Gestações (3)");
      expect(container.textContent).toContain("#101");
      expect(container.textContent).toContain("Confirmada");
      expect(container.textContent).toContain("2024-01-10");
      expect(container.textContent).toContain("2024-02-15");
      expect(container.textContent).toContain("2024-06-09");
      expect(container.textContent).toContain("Iniciada nesta fazenda");
    });

    it("Case B: renders own closure when safe closeReason is present", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      expect(container.textContent).toContain("#102");
      expect(container.textContent).toContain("Encerrada");
      expect(container.textContent).toContain("2023-06-10");
      expect(container.textContent).toContain("Parto");
    });

    it("Case C: redacted process with null status and closeReason displays '-' without fabricating active/open state", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      // Find the row for pregnancy #103
      const rows = Array.from(container.querySelectorAll("tbody tr"));
      const row103 = rows.find((r) => r.textContent?.includes("#103"));
      expect(row103).toBeDefined();
      const cells = Array.from(row103!.querySelectorAll("td")).map((c) => c.textContent?.trim());
      // Status column (index 1) should be "-"
      expect(cells[1]).toBe("-");
      // Close reason column (index 6) should be "-"
      expect(cells[6]).toBe("-");
      // Should not fabricate "Ativa" or "Aberta" for this row
      expect(row103!.textContent).not.toContain("Ativa");
      expect(row103!.textContent).not.toContain("Aberta");
    });

    it("Case D: renders neutral foreign coverage context box without attributing creation to current farm", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      expect(container.textContent).toContain("Cobertura registrada na Fazenda #99");
      expect(container.textContent).toContain("Data: 2022-01-10");
      expect(container.textContent).toContain("Tipo: Natural");
      expect(container.textContent).toContain("Reprodutor: BODE-ORIGEM-99");
      expect(container.textContent).toContain("Ref. Evento #88");
    });

    it("Case E: foreign coverage context does not leak into the requesting farm's event stream", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      expect(container.textContent).toContain("Eventos Reprodutivos (6)");
      // Event IDs from current farm
      expect(container.textContent).toContain("#501");
      expect(container.textContent).toContain("#502");
      expect(container.textContent).toContain("#503");
      expect(container.textContent).toContain("#504");
      expect(container.textContent).toContain("#505");
      expect(container.textContent).toContain("#506");

      // Origin farm 99 event #88 must NOT exist as a standalone event row in the event table
      const eventTable = container.querySelector("table[aria-label='Tabela de eventos reprodutivos históricos']");
      expect(eventTable).not.toBeNull();
      const eventRow88 = Array.from(eventTable!.querySelectorAll("tbody tr")).find((r) =>
        r.firstElementChild?.textContent?.includes("#88")
      );
      expect(eventRow88).toBeUndefined();
    });

    it("Case F: COVERAGE event renders breedingType and breederRef", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      const eventTable = container.querySelector("table[aria-label='Tabela de eventos reprodutivos históricos']")!;
      const row501 = Array.from(eventTable.querySelectorAll("tbody tr")).find((r) =>
        r.textContent?.includes("#501")
      )!;

      expect(row501.textContent).toContain("Cobertura");
      expect(row501.textContent).toContain("Tipo: Natural");
      expect(row501.textContent).toContain("Reprodutor: BOD-44");
      expect(row501.textContent).toContain("Gestação #101");
      expect(row501.textContent).toContain("Cobertura normal");
    });

    it("Case G: COVERAGE_CORRECTION event renders relatedEventId and correctedEventDate", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      const eventTable = container.querySelector("table[aria-label='Tabela de eventos reprodutivos históricos']")!;
      const row502 = Array.from(eventTable.querySelectorAll("tbody tr")).find((r) =>
        r.textContent?.includes("#502")
      )!;

      expect(row502.textContent).toContain("Correção de cobertura");
      expect(row502.textContent).toContain("Ref. Evento #501");
      expect(row502.textContent).toContain("Data corrigida: 2024-01-10");
      expect(row502.textContent).toContain("Tipo: Inseminação artificial");
      expect(row502.textContent).toContain("Reprodutor: SEMEN-123");
      expect(row502.textContent).toContain("Ajuste de reprodutor");
    });

    it("Case H: NEGATIVE PREGNANCY_CHECK event with pregnancyId null renders correctly", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      const eventTable = container.querySelector("table[aria-label='Tabela de eventos reprodutivos históricos']")!;
      const row503 = Array.from(eventTable.querySelectorAll("tbody tr")).find((r) =>
        r.textContent?.includes("#503")
      )!;

      expect(row503.textContent).toContain("Diagnóstico de prenhez");
      expect(row503.textContent).toContain("Resultado: Negativo");
      expect(row503.textContent).toContain("Primeiro toque negativo");
      expect(row503.textContent).not.toContain("Gestação #");
    });

    it("Case I: POSITIVE PREGNANCY_CHECK event with pregnancyId null renders correctly", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      const eventTable = container.querySelector("table[aria-label='Tabela de eventos reprodutivos históricos']")!;
      const row504 = Array.from(eventTable.querySelectorAll("tbody tr")).find((r) =>
        r.textContent?.includes("#504")
      )!;

      expect(row504.textContent).toContain("Diagnóstico de prenhez");
      expect(row504.textContent).toContain("Resultado: Positivo");
      expect(row504.textContent).toContain("Segundo toque confirmado");
      expect(row504.textContent).not.toContain("Gestação #");
    });

    it("Case J: PREGNANCY_CLOSE event does not display closeReason in event row", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      const eventTable = container.querySelector("table[aria-label='Tabela de eventos reprodutivos históricos']")!;
      const row505 = Array.from(eventTable.querySelectorAll("tbody tr")).find((r) =>
        r.textContent?.includes("#505")
      )!;

      expect(row505.textContent).toContain("Encerramento de gestação");
      expect(row505.textContent).toContain("Gestação #102");
      expect(row505.textContent).toContain("Parto duplo sem complicações");
      // Must NOT display closeReason in event row
      expect(row505.textContent).not.toContain("Motivo");
      expect(row505.textContent).not.toContain("BIRTH");
    });

    it("Case K: WEANING independent event renders safely", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      const eventTable = container.querySelector("table[aria-label='Tabela de eventos reprodutivos históricos']")!;
      const row506 = Array.from(eventTable.querySelectorAll("tbody tr")).find((r) =>
        r.textContent?.includes("#506")
      )!;

      expect(row506.textContent).toContain("Desmame");
      expect(row506.textContent).toContain("Desmame aos 60 dias");
    });

    it("Case L: empty historical reproduction dossier renders specific empty state without empty tables", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce({
        goatId: 42,
        processes: [],
        events: [],
      });

      await renderComponent();

      expect(container.textContent).toContain("Sem histórico reprodutivo disponível para esta fazenda.");
      expect(container.querySelector("table[aria-label='Tabela de processos gestacionais históricos']")).toBeNull();
      expect(container.querySelector("table[aria-label='Tabela de eventos reprodutivos históricos']")).toBeNull();
    });

    it("Case M: isolated loading state while reproduction data is pending", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockReturnValueOnce(new Promise(() => {}));

      await renderComponent();

      expect(container.textContent).toContain("Carregando dados reprodutivos...");
      // Other sections are still rendered
      expect(container.textContent).toContain("Estrela do Norte");
    });

    it("Case N: isolated error state when reproduction fetch fails", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockRejectedValueOnce(new Error("Database connection error"));

      await renderComponent();

      expect(container.textContent).toContain("Não foi possível carregar os dados reprodutivos");
      const retryButtons = Array.from(container.querySelectorAll("button")).filter(
        (b) => b.textContent?.includes("Tentar novamente")
      );
      expect(retryButtons.length).toBeGreaterThan(0);
    });

    it("Case O: reproduction retry reloads only reproduction section", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockRejectedValueOnce(new Error("Transient error"));

      await renderComponent();

      expect(container.textContent).toContain("Não foi possível carregar os dados reprodutivos");

      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      // Find the retry button inside reproduction section
      const reproSection = container.querySelector(".dossier-reproduction-section")!;
      const retryBtn = reproSection.querySelector("button")!;
      expect(retryBtn.textContent).toContain("Tentar novamente");

      await act(async () => {
        retryBtn.click();
      });

      expect(container.textContent).toContain("Processos e Gestações (3)");
      expect(container.textContent).toContain("Eventos Reprodutivos (6)");
    });

    it("Case P: strictly read-only with no mutation controls", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockResolvedValueOnce(mockReproductionData);

      await renderComponent();

      const reproSection = container.querySelector(".dossier-reproduction-section")!;
      const buttons = Array.from(reproSection.querySelectorAll("button"));
      // No mutation buttons exist in the reproduction section
      expect(buttons.length).toBe(0);

      const links = Array.from(reproSection.querySelectorAll("a"));
      expect(links.length).toBe(0);

      const sectionText = reproSection.textContent || "";
      expect(sectionText).not.toContain("Registrar cobertura");
      expect(sectionText).not.toContain("Nova gestação");
      expect(sectionText).not.toContain("Novo evento");
      expect(sectionText).not.toContain("Editar");
      expect(sectionText).not.toContain("Excluir");
      expect(sectionText).not.toContain("Encerrar gestação");
    });

    it("Case Q: other dossier sections remain rendered when reproduction fails", async () => {
      mockedGetBasic.mockResolvedValueOnce(mockBasicDossier);
      mockedGetGenealogy.mockResolvedValueOnce(mockLocalGenealogy);
      mockedGetReproduction.mockRejectedValueOnce(new Error("Reproduction service unreachable"));

      await renderComponent();

      // Basic dossier is intact
      expect(container.textContent).toContain("Estrela do Norte");
      expect(container.textContent).toContain("RG: RG-042");

      // Genealogy is intact
      expect(container.textContent).toContain("Árvore Genealógica Histórica");

      // Milk section is intact
      expect(container.textContent).toContain("Lactações & Produção de Leite");

      // Reproduction shows error
      expect(container.textContent).toContain("Não foi possível carregar os dados reprodutivos");
    });
  });
});
