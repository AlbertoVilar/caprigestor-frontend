import { describe, expect, it, vi, beforeEach } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  getFarmGoatRegistryHistoricalDossierBasic,
  getFarmGoatRegistryHistoricalGenealogy,
  InvalidFarmIdError,
  InvalidGoatTokenError,
} from "./farmGoatRegistryHistoricalDossier";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
  },
}));

describe("farmGoatRegistryHistoricalDossier API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFarmGoatRegistryHistoricalDossierBasic", () => {
    it("throws InvalidFarmIdError when farmId is invalid", async () => {
      await expect(
        getFarmGoatRegistryHistoricalDossierBasic(0, "technical-42")
      ).rejects.toThrow(InvalidFarmIdError);
    });

    it("throws InvalidGoatTokenError when goatIdToken is empty", async () => {
      await expect(
        getFarmGoatRegistryHistoricalDossierBasic(10, "")
      ).rejects.toThrow(InvalidGoatTokenError);
    });

    it("requests basic dossier endpoint and returns response data", async () => {
      const mockData = { goatId: 42, name: "Estrela", globalStatus: "ATIVO" };
      vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: mockData });

      const result = await getFarmGoatRegistryHistoricalDossierBasic(10, "technical-42");

      expect(requestBackEnd.get).toHaveBeenCalledWith("/goatfarms/10/goat-registry/technical-42");
      expect(result).toEqual(mockData);
    });
  });

  describe("getFarmGoatRegistryHistoricalGenealogy", () => {
    it("throws InvalidFarmIdError when farmId is invalid", async () => {
      await expect(
        getFarmGoatRegistryHistoricalGenealogy(0, "technical-42")
      ).rejects.toThrow(InvalidFarmIdError);
    });

    it("requests local genealogy when complementaryAbcc is false", async () => {
      const mockData = { animalPrincipal: { relationship: "animalPrincipal", name: "Estrela", source: "LOCAL" } };
      vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: mockData });

      const result = await getFarmGoatRegistryHistoricalGenealogy(10, "technical-42", false);

      expect(requestBackEnd.get).toHaveBeenCalledWith(
        "/goatfarms/10/goat-registry/technical-42/genealogy",
        { params: {} }
      );
      expect(result).toEqual(mockData);
    });

    it("requests ABCC complementary genealogy when complementaryAbcc is true", async () => {
      const mockData = {
        animalPrincipal: { relationship: "animalPrincipal", name: "Estrela", source: "LOCAL" },
        integration: { status: "FOUND", lookupKey: "registrationNumber", message: "Success" },
      };
      vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: mockData });

      const result = await getFarmGoatRegistryHistoricalGenealogy(10, "technical-42", true);

      expect(requestBackEnd.get).toHaveBeenCalledWith(
        "/goatfarms/10/goat-registry/technical-42/genealogy",
        { params: { complementaryAbcc: true } }
      );
      expect(result).toEqual(mockData);
    });
  });
});
