import { describe, expect, it, vi, beforeEach } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  getFarmGoatRegistryHistoricalDossierBasic,
  getFarmGoatRegistryHistoricalGenealogy,
  getFarmGoatRegistryHistoricalMilkLactation,
  getFarmGoatRegistryHistoricalReproduction,
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

  describe("getFarmGoatRegistryHistoricalMilkLactation", () => {
    it("throws InvalidFarmIdError when farmId is invalid", async () => {
      await expect(
        getFarmGoatRegistryHistoricalMilkLactation(0, "technical-42")
      ).rejects.toThrow(InvalidFarmIdError);
    });

    it("throws InvalidGoatTokenError when goatIdToken is empty", async () => {
      await expect(
        getFarmGoatRegistryHistoricalMilkLactation(10, "")
      ).rejects.toThrow(InvalidGoatTokenError);
    });

    it("requests milk-lactation endpoint and returns response data", async () => {
      const mockData = {
        goatId: 42,
        lactations: [
          {
            id: 1,
            goatId: 42,
            farmId: 10,
            status: "CLOSED",
            startDate: "2024-01-01",
            endDate: "2024-10-01",
            pregnancyStartDate: null,
            dryStartDate: null,
            dryAtPregnancyDays: 90,
            restDays: 60,
            active: false,
          },
        ],
        milkProductions: [
          {
            id: 100,
            goatId: 42,
            lactationId: 1,
            farmId: 10,
            date: "2024-02-01",
            shift: "MORNING",
            volumeLiters: 3.5,
            status: "ACTIVE",
            notes: null,
            canceledAt: null,
            canceledReason: null,
            recordedDuringMilkWithdrawal: false,
            milkWithdrawalEventId: null,
            milkWithdrawalEndDate: null,
            milkWithdrawalSource: null,
          },
        ],
      };
      vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: mockData });

      const result = await getFarmGoatRegistryHistoricalMilkLactation(10, "technical-42");

      expect(requestBackEnd.get).toHaveBeenCalledWith(
        "/goatfarms/10/goat-registry/technical-42/milk-lactation"
      );
      expect(result).toEqual(mockData);
    });
  });

  describe("getFarmGoatRegistryHistoricalReproduction", () => {
    it("throws InvalidFarmIdError when farmId is invalid", async () => {
      await expect(
        getFarmGoatRegistryHistoricalReproduction(0, "technical-42")
      ).rejects.toThrow(InvalidFarmIdError);
    });

    it("throws InvalidGoatTokenError when goatIdToken is empty or bare", async () => {
      await expect(
        getFarmGoatRegistryHistoricalReproduction(10, "42")
      ).rejects.toThrow(InvalidGoatTokenError);
    });

    it("calls endpoint with encoded token and returns response", async () => {
      const mockData = {
        goatId: 42,
        processes: [
          {
            pregnancyId: 10,
            processOriginFarmId: 10,
            breedingDate: "2024-03-01",
            confirmDate: "2024-05-01",
            expectedDueDate: "2024-07-29",
            coverageEventId: 100,
            status: "CLOSED",
            closedAt: "2024-07-29",
            closeReason: "BIRTH",
            foreignCoverageContext: null,
          },
        ],
        events: [
          {
            id: 100,
            farmId: 10,
            eventType: "COVERAGE",
            eventDate: "2024-03-01",
            breedingType: "NATURAL",
            breederRef: "BOD-01",
            pregnancyId: 10,
            relatedEventId: null,
            correctedEventDate: null,
            checkScheduledDate: null,
            checkResult: null,
            notes: "Cobertura normal",
          },
        ],
      };
      vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: mockData });

      const result = await getFarmGoatRegistryHistoricalReproduction(10, "technical-42");

      expect(requestBackEnd.get).toHaveBeenCalledWith(
        "/goatfarms/10/goat-registry/technical-42/reproduction"
      );
      expect(result).toEqual(mockData);
    });

    it("preserves empty arrays and null fields", async () => {
      const emptyData = {
        goatId: 42,
        processes: [],
        events: [],
      };
      vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: emptyData });

      const result = await getFarmGoatRegistryHistoricalReproduction(10, "technical-42");
      expect(result.processes).toEqual([]);
      expect(result.events).toEqual([]);
    });
  });
});
