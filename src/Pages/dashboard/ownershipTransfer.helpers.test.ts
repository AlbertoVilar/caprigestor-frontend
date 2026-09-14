import { describe, expect, it, vi } from "vitest";
import {
  getOwnershipTransferIntent,
  resolveTechnicalGoatId,
  validateOwnershipTransferInput,
} from "./ownershipTransfer.helpers";

describe("ownership transfer helpers", () => {
  it("prefers technicalId and falls back to the transitional id", () => {
    expect(resolveTechnicalGoatId({ technicalId: 41, id: 9 })).toBe(41);
    expect(resolveTechnicalGoatId({ id: 9 })).toBe(9);
    expect(resolveTechnicalGoatId({})).toBeUndefined();
  });

  it.each([
    [undefined, 41, 42, "motivo", "Não é possível transferir este animal sem identificador estrutural."],
    [9, 41, 41, "motivo", "Selecione uma fazenda de destino diferente da atual."],
    [9, 41, 42, "   ", "Informe o motivo da transferência."],
  ])("rejects invalid input", (technicalGoatId, currentFarmId, targetFarmId, reason, expected) => {
    expect(validateOwnershipTransferInput({
      technicalGoatId,
      currentFarmId,
      targetFarmId,
      reason,
    })).toBe(expected);
  });

  it("accepts a valid target and trimmed reason", () => {
    expect(validateOwnershipTransferInput({
      technicalGoatId: 9,
      currentFarmId: 41,
      targetFarmId: 42,
      reason: "  venda entre fazendas  ",
    })).toBeNull();
  });

  it("reuses a key for the same intent and creates a new key when it changes", () => {
    const createKey = vi.fn()
      .mockReturnValueOnce("key-1")
      .mockReturnValueOnce("key-2");
    const first = getOwnershipTransferIntent({
      current: null,
      technicalGoatId: 9,
      targetFarmId: 42,
      reason: "venda",
      createKey,
    });
    const retry = getOwnershipTransferIntent({
      current: first,
      technicalGoatId: 9,
      targetFarmId: 42,
      reason: "venda",
      createKey,
    });
    const changed = getOwnershipTransferIntent({
      current: retry,
      technicalGoatId: 9,
      targetFarmId: 43,
      reason: "venda",
      createKey,
    });

    expect(first.key).toBe("key-1");
    expect(retry).toBe(first);
    expect(changed.key).toBe("key-2");
    expect(createKey).toHaveBeenCalledTimes(2);
  });
});
