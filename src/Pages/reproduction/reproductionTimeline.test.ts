import { describe, expect, it } from "vitest";
import { buildReproductionTimelineView } from "./reproductionTimeline";

describe("reproductionTimeline", () => {
  it("builds diagnosis timeline while waiting for eligible window", () => {
    const view = buildReproductionTimelineView({
      today: "2026-03-12",
      recommendationCoverageDate: "2026-03-11",
      minCheckDate: "2026-05-10",
      recommendationStatus: "NOT_ELIGIBLE",
      hasActivePregnancy: false,
      breedingDate: null,
      expectedDueDate: null,
      hasActiveLactation: false,
    });

    expect(view.mode).toBe("DIAGNOSIS");
    expect(view.overdue).toBe(false);
    expect(view.endLabel).toContain("Diagnóstico");
    expect(view.currentStepLabel).toContain("Dia");
  });

  it("builds gestation timeline when pregnancy is active and no active lactation", () => {
    const view = buildReproductionTimelineView({
      today: "2026-03-12",
      recommendationCoverageDate: "2026-03-11",
      minCheckDate: "2026-05-10",
      recommendationStatus: "RESOLVED",
      hasActivePregnancy: true,
      breedingDate: "2026-03-11",
      expectedDueDate: "2026-08-08",
      hasActiveLactation: false,
    });

    expect(view.mode).toBe("GESTATION");
    expect(view.endLabel).toContain("Parto previsto");
    expect(view.currentStepLabel).toContain("Gestação ativa");
  });

  it("builds dry-off timeline when pregnancy and lactation are active", () => {
    const view = buildReproductionTimelineView({
      today: "2026-06-01",
      recommendationCoverageDate: "2026-03-11",
      minCheckDate: "2026-05-10",
      recommendationStatus: "RESOLVED",
      hasActivePregnancy: true,
      breedingDate: "2026-03-11",
      expectedDueDate: "2026-08-08",
      hasActiveLactation: true,
    });

    expect(view.mode).toBe("DRY_OFF");
    expect(view.endLabel).toContain("Secagem");
    expect(view.endDate).toBe("2026-05-10");
  });

  it("builds empty timeline when there is no coverage reference", () => {
    const view = buildReproductionTimelineView({
      today: "2026-03-12",
      recommendationCoverageDate: null,
      minCheckDate: null,
      recommendationStatus: null,
      hasActivePregnancy: false,
      breedingDate: null,
      expectedDueDate: null,
      hasActiveLactation: false,
    });

    expect(view.mode).toBe("NONE");
    expect(view.show).toBe(false);
  });
});
