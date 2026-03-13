import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  confirmGoatImportFromAbcc,
  listAbccRaceOptions,
  previewGoatFromAbcc,
  searchGoatsByAbcc,
} from "./goatAbccImport";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Goat ABCC Import API", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);
  const mockedPost = vi.mocked(requestBackEnd.post);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads ABCC races using canonical backend route", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        items: [
          { id: 9, name: "SAANEN", normalizedBreed: "SAANEN" },
          { id: 2, name: "BOER", normalizedBreed: "BOER" },
        ],
      },
    });

    const response = await listAbccRaceOptions(7);

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/7/goats/imports/abcc/races");
    expect(response.items).toHaveLength(2);
    expect(response.items[0].name).toBe("SAANEN");
  });

  it("executes ABCC search with race name and resolved id", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        currentPage: 1,
        totalPages: 3,
        pageSize: 2,
        items: [
          {
            externalSource: "ABCC_PUBLIC",
            externalId: "ABCC-001",
            nome: "TOPAZIO",
            raca: "SAANEN",
            sexo: "MACHO",
            situacao: "RGD",
            tod: "12345",
            toe: "67890",
            dataNascimento: "01/01/2020",
          },
        ],
      },
    });

    const response = await searchGoatsByAbcc(7, {
      raceName: "SAANEN",
      raceId: 9,
      affix: "CAPRIL VILAR",
      page: 1,
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/goatfarms/7/goats/imports/abcc/search",
      expect.objectContaining({ raceName: "SAANEN", raceId: 9, affix: "CAPRIL VILAR", page: 1 })
    );
    expect(response.items).toHaveLength(1);
    expect(response.items[0].externalId).toBe("ABCC-001");
  });

  it("loads ABCC preview using externalId", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        externalSource: "ABCC_PUBLIC",
        externalId: "ABCC-001",
        registrationNumber: "1234567890",
        name: "TOPAZIO",
        gender: "MACHO",
        breed: "SAANEN",
        color: "CHAMOISEE",
        birthDate: "2020-01-01",
        status: "ATIVO",
      },
    });

    const response = await previewGoatFromAbcc(7, "ABCC-001");

    expect(mockedPost).toHaveBeenCalledWith(
      "/goatfarms/7/goats/imports/abcc/preview",
      { externalId: "ABCC-001" }
    );
    expect(response.registrationNumber).toBe("1234567890");
    expect(response.name).toBe("TOPAZIO");
  });

  it("confirms import through backend and returns created goat", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        id: 91,
        registrationNumber: "1234567890",
        name: "TOPAZIO",
        breed: "SAANEN",
        color: "CHAMOISEE",
        gender: "Macho",
        birthDate: "2020-01-01",
        status: "Ativo",
        category: "PA",
        tod: "12345",
        toe: "67890",
        farmId: 7,
      },
    });

    const response = await confirmGoatImportFromAbcc(7, {
      externalId: "ABCC-001",
      goat: {
        registrationNumber: "1234567890",
        name: "TOPAZIO",
        gender: "Macho",
        breed: "SAANEN",
        color: "CHAMOISEE",
        birthDate: "2020-01-01",
        status: "Ativo",
        category: "PA",
        tod: "12345",
        toe: "67890",
      },
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/goatfarms/7/goats/imports/abcc/confirm",
      expect.objectContaining({ externalId: "ABCC-001" })
    );
    expect(response.registrationNumber).toBe("1234567890");
    expect(response.farmId).toBe(7);
  });

  it("propagates backend errors from confirm", async () => {
    mockedPost.mockRejectedValueOnce(new Error("conflict"));

    await expect(
      confirmGoatImportFromAbcc(7, {
        externalId: "ABCC-001",
        goat: {
          registrationNumber: "1234567890",
          name: "TOPAZIO",
          gender: "Macho",
          breed: "SAANEN",
          color: "CHAMOISEE",
          birthDate: "2020-01-01",
          status: "Ativo",
          category: "PA",
          tod: "12345",
          toe: "67890",
        },
      })
    ).rejects.toThrow("conflict");
  });
});
