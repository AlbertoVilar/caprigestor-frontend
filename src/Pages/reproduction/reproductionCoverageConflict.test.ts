import { describe, expect, it } from "vitest";
import { buildCoverageConflictState } from "./reproductionCoverageConflict";

describe("reproductionCoverageConflict", () => {
  it("returns no conflict when there is no previous coverage", () => {
    const result = buildCoverageConflictState("2026-03-01", null);

    expect(result.kind).toBe("none");
    expect(result.canProceed).toBe(true);
    expect(result.requiresConfirmation).toBe(false);
  });

  it("blocks submission when the selected date is the same as last coverage", () => {
    const result = buildCoverageConflictState("2026-03-10", "2026-03-10");

    expect(result.kind).toBe("sameDay");
    expect(result.canProceed).toBe(false);
    expect(result.message).toContain("cobertura registrada para esta cabra hoje");
    expect(result.message).toContain("Use a correção de cobertura");
  });

  it("requires explicit confirmation when selected date is after last coverage", () => {
    const result = buildCoverageConflictState("2026-03-12", "2026-03-10");

    expect(result.kind).toBe("later");
    expect(result.requiresConfirmation).toBe(true);
    expect(result.canProceed).toBe(true);
    expect(result.daysSinceLastCoverage).toBe(2);
    expect(result.message).toContain("há 2 dias");
    expect(result.message).toContain("reiniciará a contagem para diagnóstico");
  });
});
