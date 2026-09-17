import { afterEach, vi } from "vitest";

if (typeof window !== "undefined" && !window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof window.ResizeObserver;
}

afterEach(() => {
  vi.restoreAllMocks();
});
