import { describe, expect, it } from "vitest";
import { formatCivilDateInZone, todayInSaoPaulo } from "./civilDate";

describe("civil dates", () => {
  it("uses the Brazilian civil day instead of UTC near midnight", () => {
    expect(formatCivilDateInZone(new Date("2026-09-20T02:30:00.000Z"))).toBe("2026-09-19");
  });

  it("allows a deterministic Sao Paulo today value", () => {
    expect(todayInSaoPaulo(new Date("2026-09-20T02:30:00.000Z"))).toBe("2026-09-19");
  });
});
