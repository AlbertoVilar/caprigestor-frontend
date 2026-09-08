import { describe, expect, it } from "vitest";
import { resolveHighestAlertSeverity } from "./AlertRegistry";

describe("resolveHighestAlertSeverity", () => {
  it("returns the most urgent severity across providers", () => {
    expect(resolveHighestAlertSeverity(["low", "high", "medium"])).toBe("high");
    expect(resolveHighestAlertSeverity(["low", "medium"])).toBe("medium");
  });

  it("ignores unavailable providers and keeps an empty state neutral", () => {
    expect(resolveHighestAlertSeverity([undefined, "low"])).toBe("low");
    expect(resolveHighestAlertSeverity([undefined])).toBeUndefined();
    expect(resolveHighestAlertSeverity([])).toBeUndefined();
  });
});
