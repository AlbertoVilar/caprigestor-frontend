import { describe, expect, it } from "vitest";
import { convertGenealogyDTOToReactFlowData } from "./convertGenealogyDTOToReactFlowData";

describe("convertGenealogyDTOToReactFlowData", () => {
  it("builds graph with source metadata for hybrid complementary genealogy", () => {
    const { nodes, edges } = convertGenealogyDTOToReactFlowData({
      animalPrincipal: {
        nome: "Topázio",
        registro: "2114510040",
        criador: "",
        proprietario: "",
        raca: "",
        pelagem: "",
        situacao: "",
        sexo: "",
        categoria: "",
        tod: "",
        toe: "",
        dataNasc: "",
        source: "LOCAL",
      },
      pai: { nome: "Pai ABCC", registro: "123", source: "ABCC", relationship: "pai" },
      mae: { nome: "", registro: "", source: "AUSENTE", relationship: "mae" },
      avoPaterno: { nome: "", registro: "", source: "AUSENTE", relationship: "avoPaterno" },
      avoPaterna: { nome: "", registro: "", source: "AUSENTE", relationship: "avoPaterna" },
      avoMaterno: { nome: "", registro: "", source: "AUSENTE", relationship: "avoMaterno" },
      avoMaterna: { nome: "", registro: "", source: "AUSENTE", relationship: "avoMaterna" },
      bisavosPaternos: [
        { parentesco: "Bisavô Paterno (pai)", nome: "", registro: "", source: "AUSENTE" },
        { parentesco: "Bisavó Paterna (pai)", nome: "", registro: "", source: "AUSENTE" },
        { parentesco: "Bisavô Paterno (mãe)", nome: "", registro: "", source: "AUSENTE" },
        { parentesco: "Bisavó Paterna (mãe)", nome: "", registro: "", source: "AUSENTE" },
      ],
      bisavosMaternos: [
        { parentesco: "Bisavô Materno (pai)", nome: "", registro: "", source: "AUSENTE" },
        { parentesco: "Bisavó Materna (pai)", nome: "", registro: "", source: "AUSENTE" },
        { parentesco: "Bisavô Materno (mãe)", nome: "", registro: "", source: "AUSENTE" },
        { parentesco: "Bisavó Materna (mãe)", nome: "", registro: "", source: "AUSENTE" },
      ],
      integration: {
        status: "FOUND",
        lookupKey: "registrationNumber",
        message: "ok",
      },
    });

    expect(nodes.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);

    const principal = nodes.find((node) => node.data?.relation === "Animal Principal");
    const father = nodes.find((node) => node.data?.relation === "Pai");

    expect(principal?.data?.source).toBe("LOCAL");
    expect(father?.data?.source).toBe("ABCC");
  });
});
