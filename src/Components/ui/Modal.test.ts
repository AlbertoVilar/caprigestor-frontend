import { describe, expect, it } from "vitest";
import { shouldCloseModalOnEscape } from "./Modal";

describe("Modal", () => {
  it("closes on Escape when enabled", () => {
    expect(shouldCloseModalOnEscape("Escape", true)).toBe(true);
  });

  it("does not close on non-Escape keys or when disabled", () => {
    expect(shouldCloseModalOnEscape("Enter", true)).toBe(false);
    expect(shouldCloseModalOnEscape("Escape", false)).toBe(false);
  });
});
