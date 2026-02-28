import { afterEach, describe, expect, it, vi } from "vitest";
import { createInventoryPayloadHash } from "../../api/GoatFarmAPI/inventory";
import {
  createInventoryRetrySnapshot,
  isSameInventoryRetryPayload,
  syncInventoryDraftKey,
} from "./inventoryRetry";

describe("inventoryRetry", () => {
  const payload = {
    type: "OUT" as const,
    quantity: 2,
    itemId: 101,
    movementDate: "2026-02-28",
    reason: "Baixa de teste",
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the same key when retrying the same payload after a network failure", () => {
    const snapshot = createInventoryRetrySnapshot(12, payload, "inventory-fixed-key");

    expect(isSameInventoryRetryPayload(snapshot, { ...payload })).toBe(true);

    const nextDraft = syncInventoryDraftKey({
      currentKey: snapshot.idempotencyKey,
      currentPayloadHash: snapshot.payloadHash,
      nextPayload: { ...payload },
    });

    expect(nextDraft.idempotencyKey).toBe("inventory-fixed-key");
    expect(nextDraft.payloadHash).toBe(snapshot.payloadHash);
    expect(nextDraft.changed).toBe(false);
  });

  it("creates a new key when the payload changes", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("fresh-key"),
    });

    const nextDraft = syncInventoryDraftKey({
      currentKey: "inventory-old-key",
      currentPayloadHash: createInventoryPayloadHash(payload),
      nextPayload: {
        ...payload,
        quantity: 3,
      },
    });

    expect(nextDraft.idempotencyKey).toBe("inventory-fresh-key");
    expect(nextDraft.payloadHash).toBe(
      createInventoryPayloadHash({
        ...payload,
        quantity: 3,
      })
    );
    expect(nextDraft.changed).toBe(true);
  });
});
