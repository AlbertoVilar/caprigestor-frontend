import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  fetchFarmByName,
  fetchGoatByRegistrationNumber,
  getAllFarms,
  getAllFarmsPaginated,
  getAllGoatsPaginated,
  getGoatFarmById,
  getGoatFarmForManagement,
} from "./goatFarm";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
  },
}));

describe("Farm management API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads and normalizes the complete administrative farm response", async () => {
    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({
      data: {
        id: 19,
        name: "Capril Vilar",
        tod: "14008",
        version: 3,
        user: {
          id: 22,
          name: "Carlos Vidal",
          email: "carlos@example.invalid",
          cpf: "12345678900",
        },
        address: {
          id: 20,
          street: "Rua das Cabras",
          neighborhood: "Centro",
          city: "Rio de Janeiro",
          state: "RJ",
          zipCode: "20000-000",
          country: "Brasil",
        },
        phones: [{ id: 21, ddd: "21", number: "999999999" }],
      },
    });

    await expect(getGoatFarmForManagement(19)).resolves.toMatchObject({
      id: 19,
      name: "Capril Vilar",
      tod: "14008",
      version: 3,
      userId: 22,
      userName: "Carlos Vidal",
      userEmail: "carlos@example.invalid",
      userCpf: "12345678900",
      addressId: 20,
      street: "Rua das Cabras",
      district: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      cep: "20000-000",
      country: "Brasil",
      phones: [{ id: 21, ddd: "21", number: "999999999" }],
    });
    expect(requestBackEnd.get).toHaveBeenCalledWith("/goatfarms/19/management");
  });

  it("keeps public farm reads and catalog wrappers available", async () => {
    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({
      data: {
        id: 19,
        name: "Capril Vilar",
        tod: "14008",
        userId: 22,
        userName: "Carlos Vidal",
        userEmail: "carlos@example.invalid",
        addressId: 20,
        street: "Rua das Cabras",
        district: "Centro",
        city: "Rio de Janeiro",
        state: "RJ",
        cep: "20000000",
        country: "Brasil",
        phones: [{ id: 21, ddd: "21", number: "999999999" }],
      },
    });
    await expect(getGoatFarmById(19)).resolves.toMatchObject({ id: 19, country: "Brasil" });

    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: { content: [{ id: 19, name: "Capril Vilar" }] } });
    await expect(getAllFarms()).resolves.toHaveLength(1);

    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: { content: [], page: { size: 12, number: 0, totalPages: 0, totalElements: 0 } } });
    await expect(getAllFarmsPaginated()).resolves.toMatchObject({ content: [], page: { totalElements: 0 } });

    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: { content: [] } });
    await expect(getAllGoatsPaginated(19, 0, 12)).resolves.toEqual({ content: [] });

    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: { id: 1615325001 } });
    await expect(fetchGoatByRegistrationNumber("1615325001")).resolves.toEqual({ id: 1615325001 });

    vi.mocked(requestBackEnd.get).mockResolvedValueOnce({ data: { id: 19, name: "Capril Vilar" } });
    await expect(fetchFarmByName("Capril Vilar")).resolves.toEqual({ id: 19, name: "Capril Vilar" });
  });
});
