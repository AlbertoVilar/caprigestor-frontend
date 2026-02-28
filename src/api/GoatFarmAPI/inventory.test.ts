import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import {
  createInventoryItem,
  createInventoryMovement,
  listInventoryItems,
} from "./inventory";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Inventory API", () => {
  const mockedGet = vi.mocked(requestBackEnd.get);
  const mockedPost = vi.mocked(requestBackEnd.post);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists inventory items using the canonical route and parses paged content", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 11,
            name: "Ração Inicial",
            trackLot: true,
            active: true,
          },
        ],
        page: {
          number: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      },
    });

    const result = await listInventoryItems(42, 0, 25, true);

    expect(mockedGet).toHaveBeenCalledWith("/goatfarms/42/inventory/items", {
      params: {
        page: 0,
        size: 25,
        activeOnly: true,
      },
    });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].name).toBe("Ração Inicial");
    expect(result.page.totalElements).toBe(1);
  });

  it("creates an inventory item and trims the payload name", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        id: 88,
        name: "Suplemento Mineral",
        trackLot: false,
        active: true,
      },
    });

    const result = await createInventoryItem(7, {
      name: "  Suplemento Mineral  ",
      trackLot: false,
    });

    expect(mockedPost).toHaveBeenCalledWith("/goatfarms/7/inventory/items", {
      name: "Suplemento Mineral",
      trackLot: false,
    });
    expect(result.id).toBe(88);
    expect(result.active).toBe(true);
  });

  it("sends the movement command with Idempotency-Key and strips empty optional fields", async () => {
    mockedPost.mockResolvedValueOnce({
      status: 201,
      data: {
        movementId: 9001,
        type: "OUT",
        quantity: 2,
        itemId: 101,
        lotId: null,
        movementDate: "2026-02-27",
        resultingBalance: 18,
        createdAt: "2026-02-27T12:00:00Z",
      },
    });

    const result = await createInventoryMovement(
      42,
      {
        type: "OUT",
        quantity: 2,
        itemId: 101,
        movementDate: "",
        reason: "   ",
      },
      { idempotencyKey: "inventory-fixed-key" }
    );

    expect(mockedPost).toHaveBeenCalledWith(
      "/goatfarms/42/inventory/movements",
      {
        type: "OUT",
        quantity: 2,
        itemId: 101,
      },
      {
        headers: {
          "Idempotency-Key": "inventory-fixed-key",
        },
      }
    );

    expect(result.replayed).toBe(false);
    expect(result.responseStatus).toBe(201);
    expect(result.idempotencyKey).toBe("inventory-fixed-key");
    expect(result.movement.movementId).toBe(9001);
  });

  it("preserves adjustDirection and marks replay when backend returns 200", async () => {
    mockedPost.mockResolvedValueOnce({
      status: 200,
      data: {
        movementId: 9002,
        type: "ADJUST",
        quantity: 1.5,
        itemId: 202,
        lotId: 12,
        movementDate: "2026-02-27",
        resultingBalance: 9.5,
        createdAt: "2026-02-27T12:05:00Z",
      },
    });

    const result = await createInventoryMovement(
      7,
      {
        type: "ADJUST",
        quantity: 1.5,
        itemId: 202,
        lotId: 12,
        adjustDirection: "DECREASE",
        movementDate: "2026-02-27",
        reason: "Ajuste manual",
      },
      { idempotencyKey: "inventory-replay-key" }
    );

    expect(mockedPost).toHaveBeenCalledWith(
      "/goatfarms/7/inventory/movements",
      {
        type: "ADJUST",
        quantity: 1.5,
        itemId: 202,
        lotId: 12,
        adjustDirection: "DECREASE",
        movementDate: "2026-02-27",
        reason: "Ajuste manual",
      },
      {
        headers: {
          "Idempotency-Key": "inventory-replay-key",
        },
      }
    );

    expect(result.replayed).toBe(true);
    expect(result.responseStatus).toBe(200);
    expect(result.movement.resultingBalance).toBe(9.5);
  });
});
