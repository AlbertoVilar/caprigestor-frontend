import { describe, expect, it } from "vitest";
import { toGoatGenealogyDTO } from "./normalizeGenealogyResponse";

describe("normalizeGenealogyResponse", () => {
  it("maps complementary hybrid response with sources and integration", () => {
    const dto = toGoatGenealogyDTO({
      animalPrincipal: {
        relationship: "animalPrincipal",
        name: "Topázio",
        registrationNumber: "2114510040",
        source: "LOCAL",
        localGoatId: "2114510040",
      },
      pai: {
        relationship: "pai",
        name: "Pai ABCC",
        registrationNumber: "123",
        source: "ABCC",
      },
      mae: {
        relationship: "mae",
        source: "AUSENTE",
      },
      avoPaterno: { relationship: "avoPaterno", source: "AUSENTE" },
      avoPaterna: { relationship: "avoPaterna", source: "AUSENTE" },
      avoMaterno: { relationship: "avoMaterno", source: "AUSENTE" },
      avoMaterna: { relationship: "avoMaterna", source: "AUSENTE" },
      bisavoPaternoPai: { relationship: "Bisavô Paterno (pai)", source: "AUSENTE" },
      bisavoPaternaPai: { relationship: "Bisavó Paterna (pai)", source: "AUSENTE" },
      bisavoPaternoMae: { relationship: "Bisavô Paterno (mãe)", source: "AUSENTE" },
      bisavoPaternaMae: { relationship: "Bisavó Paterna (mãe)", source: "AUSENTE" },
      bisavoMaternoPai: { relationship: "Bisavô Materno (pai)", source: "AUSENTE" },
      bisavoMaternaPai: { relationship: "Bisavó Materna (pai)", source: "AUSENTE" },
      bisavoMaternoMae: { relationship: "Bisavô Materno (mãe)", source: "AUSENTE" },
      bisavoMaternaMae: { relationship: "Bisavó Materna (mãe)", source: "AUSENTE" },
      integration: {
        status: "FOUND",
        lookupKey: "registrationNumber",
        message: "Genealogia complementar ABCC carregada com sucesso.",
      },
    });

    expect(dto.animalPrincipal.nome).toBe("Topázio");
    expect(dto.animalPrincipal.source).toBe("LOCAL");
    expect(dto.pai?.source).toBe("ABCC");
    expect(dto.mae?.source).toBe("AUSENTE");
    expect(dto.bisavosPaternos).toHaveLength(4);
    expect(dto.integration?.status).toBe("FOUND");
  });

  it("keeps legacy response mapping compatible", () => {
    const dto = toGoatGenealogyDTO({
      goatName: "XEQUE",
      goatRegistration: "1643218012",
      fatherName: "PAI",
      fatherRegistration: "111",
    });

    expect(dto.animalPrincipal.nome).toBe("XEQUE");
    expect(dto.animalPrincipal.registro).toBe("1643218012");
    expect(dto.pai?.nome).toBe("PAI");
    expect(dto.pai?.source).toBe("LOCAL");
  });
});
