import { describe, expect, it } from "vitest";
import { normalizeText, toGoatResponseDTO } from "./goatConverter";

describe("goatConverter text normalization", () => {
  it("preserva caracteres portugueses válidos", () => {
    expect(normalizeText("PLUTÃO V DO CAPRIL VILAR")).toBe("PLUTÃO V DO CAPRIL VILAR");
    expect(normalizeText("RAÇÃO E PRODUÇÃO")).toBe("RAÇÃO E PRODUÇÃO");
  });

  it("corrige sequências legadas com codificação duplicada", () => {
    expect(normalizeText("ReproduÃ§Ã£o e lactaÃ§Ã£o")).toBe("Reprodução e lactação");
  });

  it("mantém o nome correto ao converter a resposta para o card", () => {
    const goat = toGoatResponseDTO({
      registrationNumber: "1643218013",
      name: "PLUTÃO V DO CAPRIL VILAR",
      breed: "ALPINA",
      color: "CHAMOISÉE",
      gender: "Fêmea",
      birthDate: "2018-06-27",
      status: "Ativo",
      category: "PO",
      toe: "18013",
      tod: "16432",
      farmId: 1,
    });

    expect(goat.name).toBe("PLUTÃO V DO CAPRIL VILAR");
  });
});
