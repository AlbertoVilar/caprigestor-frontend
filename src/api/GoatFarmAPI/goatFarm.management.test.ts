import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { getGoatFarmForManagement } from "./goatFarm";

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
});
