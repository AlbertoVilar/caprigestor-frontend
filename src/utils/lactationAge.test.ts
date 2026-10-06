import { describe, expect, it } from "vitest";
import { classifyLactationAge } from "./lactationAge";

describe("classifyLactationAge", () => {
  it("fails closed when birth date is unavailable", () => {
    expect(classifyLactationAge(null, "2026-09-28")).toBe("missing-birth-date");
  });

  it("rejects a start before birth, independently of the young-age warning", () => {
    expect(classifyLactationAge("2026-09-28", "2026-09-27")).toBe("before-birth");
  });

  it("marks the birth date and day before the anniversary as exceptional", () => {
    expect(classifyLactationAge("2026-09-28", "2026-09-28")).toBe("young");
    expect(classifyLactationAge("2025-09-29", "2026-09-28")).toBe("young");
  });

  it("uses the calendar anniversary, including leap-day births", () => {
    expect(classifyLactationAge("2025-09-28", "2026-09-28")).toBe("adult");
    expect(classifyLactationAge("2024-02-29", "2025-02-27")).toBe("young");
    expect(classifyLactationAge("2024-02-29", "2025-02-28")).toBe("adult");
  });
});
