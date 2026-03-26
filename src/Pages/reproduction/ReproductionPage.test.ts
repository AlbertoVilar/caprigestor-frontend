import { describe, expect, it } from "vitest";
import type { PregnancyResponseDTO } from "../../Models/ReproductionDTOs";
import {
  isLatestCycleClosedByBirth,
  resolveActivePregnancyResult,
} from "./ReproductionPage";

describe("resolveActivePregnancyResult", () => {
  it("returns the active pregnancy when the refresh call succeeds", () => {
    const pregnancy: PregnancyResponseDTO = {
      id: 17,
      farmId: 17,
      goatId: "UI26032601",
      status: "ACTIVE",
      breedingDate: "2026-01-18",
      confirmDate: "2026-03-19",
      expectedDueDate: "2026-06-17",
      closedAt: null,
      closeReason: null,
      notes: "UI smoke positive setup",
    };

    expect(
      resolveActivePregnancyResult({
        status: "fulfilled",
        value: pregnancy,
      })
    ).toEqual(pregnancy);
  });

  it("clears stale active pregnancy state when the refresh call is rejected", () => {
    expect(
      resolveActivePregnancyResult({
        status: "rejected",
        reason: new Error("404"),
      })
    ).toBeNull();
  });

  it("identifies when the latest cycle was terminally closed by birth", () => {
    expect(
      isLatestCycleClosedByBirth({
        activePregnancy: null,
        latestCoverageEventDate: "2026-01-18",
        pregnancyHistory: [
          {
            id: 17,
            farmId: 17,
            goatId: "UI26032601",
            status: "CLOSED",
            breedingDate: "2026-01-18",
            confirmDate: "2026-03-19",
            expectedDueDate: "2026-06-17",
            closedAt: "2026-03-25",
            closeReason: "BIRTH",
            notes: "UI smoke positive setup",
          },
        ],
      })
    ).toBe(true);
  });
});
