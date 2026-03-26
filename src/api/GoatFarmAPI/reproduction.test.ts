import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { AlertsEventBus } from "../../services/alerts/AlertsEventBus";
import { registerBirth, registerWeaning } from "./reproduction";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("../../services/alerts/AlertsEventBus", () => ({
  AlertsEventBus: {
    emit: vi.fn(),
  },
}));

describe("Reproduction API", () => {
  const mockedPost = vi.mocked(requestBackEnd.post);
  const mockedEmit = vi.mocked(AlertsEventBus.emit);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers birth with linked kids using canonical route", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        pregnancy: { id: 88 },
        kids: [
          {
            registrationNumber: "164321001",
            name: "Filha 1",
          },
        ],
      },
    });

    await registerBirth(1, "MATRIZ-01", 88, {
      birthDate: "2026-03-16",
      fatherRegistrationNumber: "164329999",
      notes: "Parto normal.",
      kids: [
        {
          registrationNumber: "164321001",
          name: "Filha 1",
          gender: "FEMEA",
          breed: "SAANEN",
          category: "PA",
        },
      ],
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/goatfarms/1/goats/MATRIZ-01/reproduction/pregnancies/88/births",
      expect.objectContaining({
        birthDate: "2026-03-16",
        fatherRegistrationNumber: "164329999",
      })
    );
    expect(mockedEmit).toHaveBeenCalledWith(1);
  });

  it("registers weaning using canonical route", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        goatId: "164321001",
        weaningDate: "2026-06-20",
        previousStatus: "ATIVO",
        currentStatus: "ATIVO",
      },
    });

    const result = await registerWeaning(1, "164321001", {
      weaningDate: "2026-06-20",
      notes: "Desmame no lote A.",
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/goatfarms/1/goats/164321001/reproduction/weaning",
      {
        weaningDate: "2026-06-20",
        notes: "Desmame no lote A.",
      }
    );
    expect(result.goatId).toBe("164321001");
    expect(mockedEmit).toHaveBeenCalledWith(1);
  });
});

