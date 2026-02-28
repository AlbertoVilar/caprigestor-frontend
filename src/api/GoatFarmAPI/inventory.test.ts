import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestBackEnd } from "../../utils/request";
import { createInventoryMovement } from "./inventory";

vi.mock("../../utils/request", () => ({
  requestBackEnd: {
    post: vi.fn(),
  },
}));

describe("Inventory API", () => {
  const mockedPost = vi.mocked(requestBackEnd.post);

  beforeEach(() => {
    vi.clearAllMocks();
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
