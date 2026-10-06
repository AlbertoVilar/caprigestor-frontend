import { describe, expect, it } from "vitest";
import { adaptHistoricalGenealogyToPresentational } from "./historicalGenealogyAdapter";
import type { FarmGoatRegistryHistoricalGenealogyDTO } from "../../../Models/FarmGoatHistoricalDossierDTOs";

describe("historicalGenealogyAdapter", () => {
  const fullBackendResponse: FarmGoatRegistryHistoricalGenealogyDTO = {
    animalPrincipal: {
      relationship: "animalPrincipal",
      name: "Estrela do Norte",
      registrationNumber: "RG-042",
      source: "LOCAL",
      localTechnicalGoatId: 42,
    },
    pai: {
      relationship: "pai",
      name: "Pai Local",
      registrationNumber: "RG-PAI",
      source: "LOCAL",
      localTechnicalGoatId: 101,
    },
    mae: {
      relationship: "mae",
      name: "Mãe Declarada",
      registrationNumber: "RG-MAE",
      source: "DECLARADO",
      localTechnicalGoatId: null,
    },
    avoPaterno: {
      relationship: "avoPaterno",
      name: "Avô Paterno ABCC",
      registrationNumber: "RG-AVO-P1",
      source: "ABCC",
      localTechnicalGoatId: null,
    },
    avoPaterna: null,
    avoMaterno: null,
    avoMaterna: {
      relationship: "avoMaterna",
      name: null,
      registrationNumber: null,
      source: "AUSENTE",
      localTechnicalGoatId: null,
    },
    bisavoPaternoPai: {
      relationship: "bisavoPaternoPai",
      name: "Bisavô PP",
      registrationNumber: "RG-BPP",
      source: "LOCAL",
      localTechnicalGoatId: 201,
    },
    bisavoPaternaPai: null,
    bisavoPaternoMae: null,
    bisavoPaternaMae: null,
    bisavoMaternoPai: null,
    bisavoMaternaPai: null,
    bisavoMaternoMae: null,
    bisavoMaternaMae: null,
    integration: null,
  };

  it("converts exact 15-field backend response to presentational GoatGenealogyDTO", () => {
    const result = adaptHistoricalGenealogyToPresentational(fullBackendResponse);

    expect(result.animalPrincipal.nome).toBe("Estrela do Norte");
    expect(result.animalPrincipal.registro).toBe("RG-042");
    expect(result.animalPrincipal.source).toBe("LOCAL");
    expect(result.animalPrincipal.localGoatId).toBe("42"); // numeric to string conversion

    expect(result.pai?.nome).toBe("Pai Local");
    expect(result.pai?.source).toBe("LOCAL");
    expect(result.pai?.localGoatId).toBe("101");

    expect(result.mae?.nome).toBe("Mãe Declarada");
    expect(result.mae?.source).toBe("DECLARADO");
    expect(result.mae?.localGoatId).toBeNull();

    expect(result.avoPaterno?.nome).toBe("Avô Paterno ABCC");
    expect(result.avoPaterno?.source).toBe("ABCC");

    expect(result.avoMaterna?.source).toBe("AUSENTE");

    expect(result.bisavosPaternos).toBeDefined();
    expect(result.bisavosPaternos).toHaveLength(4);
    expect(result.bisavosPaternos![0].nome).toBe("Bisavô PP");
    expect(result.bisavosPaternos![0].localGoatId).toBe("201");
    expect(result.bisavosPaternos![1].source).toBe("AUSENTE");

    expect(result.bisavosMaternos).toBeDefined();
    expect(result.bisavosMaternos).toHaveLength(4);
    expect(result.bisavosMaternos!.every((b) => b.source === "AUSENTE")).toBe(true);

    expect(result.integration).toBeUndefined();
  });

  it("handles non-null integration status and lookup message", () => {
    const responseWithIntegration: FarmGoatRegistryHistoricalGenealogyDTO = {
      ...fullBackendResponse,
      integration: {
        status: "FOUND",
        lookupKey: "RG-042",
        message: "Consulta ABCC realizada com sucesso",
      },
    };

    const result = adaptHistoricalGenealogyToPresentational(responseWithIntegration);

    expect(result.integration).toBeDefined();
    expect(result.integration?.status).toBe("FOUND");
    expect(result.integration?.lookupKey).toBe("RG-042");
    expect(result.integration?.message).toBe("Consulta ABCC realizada com sucesso");
  });
});
