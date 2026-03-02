import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadLastGoatContext,
  resolveLegacyDashboardPath,
  saveLastGoatContext,
} from "./lastGoatContext";

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  clear: () => void;
};

const createMemoryStorage = (): MemoryStorage => {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    clear: () => {
      store.clear();
    },
  };
};

describe("lastGoatContext", () => {
  beforeEach(() => {
    const localStorage = createMemoryStorage();
    const sessionStorage = createMemoryStorage();

    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage,
        sessionStorage,
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("stores and restores the last animal context", () => {
    saveLastGoatContext(7, 99);

    expect(loadLastGoatContext()).toEqual({
      farmId: "7",
      goatId: "99",
    });
  });

  it("redirects the legacy dashboard to the explicit canonical context when params exist", () => {
    expect(
      resolveLegacyDashboardPath({
        farmId: "12",
        goatId: "88",
      })
    ).toBe("/app/goatfarms/12/goats/88");
  });

  it("redirects the legacy dashboard to the last known animal when stored context exists", () => {
    saveLastGoatContext(5, 21);

    expect(resolveLegacyDashboardPath()).toBe("/app/goatfarms/5/goats/21");
  });

  it("falls back to the farm list when no context is available", () => {
    expect(resolveLegacyDashboardPath()).toBe("/goatfarms");
  });
});
