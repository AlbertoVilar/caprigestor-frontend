// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlertRegistry, type AlertProvider } from "../../services/alerts/AlertRegistry";
import { AlertsEventBus } from "../../services/alerts/AlertsEventBus";
import { FarmAlertsProvider, useFarmAlerts } from "./FarmAlertsContext";

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

type AlertsState = ReturnType<typeof useFarmAlerts>;

function Probe({ onValue }: { onValue: (value: AlertsState) => void }) {
  onValue(useFarmAlerts());
  return null;
}

async function renderProvider(
  root: Root,
  farmId: number | undefined,
  onValue: (value: AlertsState) => void,
  enabled = true,
) {
  await act(async () => {
    root.render(
      <FarmAlertsProvider farmId={farmId} enabled={enabled}>
        <Probe onValue={onValue} />
      </FarmAlertsProvider>,
    );
  });
}

function createProvider(getSummary: AlertProvider["getSummary"]): AlertProvider {
  return {
    key: "test_alert",
    label: "Test alert",
    priority: 1,
    getSummary,
    getRoute: (farmId) => `/farms/${farmId}/alerts`,
  };
}

describe("FarmAlertsProvider lifecycle refresh", () => {
  let root: Root | undefined;
  const originalVisibilityDescriptor = Object.getOwnPropertyDescriptor(document, "visibilityState");

  beforeEach(() => {
    vi.spyOn(AlertRegistry, "getProviders").mockReturnValue([]);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
      root = undefined;
    }
    vi.restoreAllMocks();
    if (originalVisibilityDescriptor) {
      Object.defineProperty(document, "visibilityState", originalVisibilityDescriptor);
    } else {
      Reflect.deleteProperty(document, "visibilityState");
    }
  });

  it("refreshes when the page becomes visible and deduplicates focus/visibility signals only", async () => {
    const getSummary = vi.fn(async () => ({ count: 1 }));
    vi.spyOn(AlertRegistry, "getProviders").mockReturnValue([createProvider(getSummary)]);
    root = createRoot(document.createElement("div"));
    await renderProvider(root, 12, () => undefined);
    expect(getSummary).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(getSummary).toHaveBeenCalledTimes(2);

    await act(async () => AlertsEventBus.emit(12));
    expect(getSummary).toHaveBeenCalledTimes(3);
  });

  it("ignores hidden visibility changes and removes lifecycle listeners on unmount", async () => {
    const getSummary = vi.fn(async () => ({ count: 1 }));
    vi.spyOn(AlertRegistry, "getProviders").mockReturnValue([createProvider(getSummary)]);
    root = createRoot(document.createElement("div"));
    await renderProvider(root, 12, () => undefined);
    expect(getSummary).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(getSummary).toHaveBeenCalledTimes(1);

    await act(async () => root?.unmount());
    root = undefined;
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(getSummary).toHaveBeenCalledTimes(1);
  });

  it("ignores an older farm response after the selected farm changes", async () => {
    let resolveFirst!: (summary: { count: number }) => void;
    const getSummary = vi.fn((farmId: number) => {
      if (farmId === 1) return new Promise<{ count: number }>((resolve) => { resolveFirst = resolve; });
      return Promise.resolve({ count: 2 });
    });
    vi.spyOn(AlertRegistry, "getProviders").mockReturnValue([createProvider(getSummary)]);
    root = createRoot(document.createElement("div"));
    let latest!: AlertsState;
    await renderProvider(root, 1, (value) => { latest = value; });
    await renderProvider(root, 2, (value) => { latest = value; });
    await act(async () => { await Promise.resolve(); });
    expect(getSummary).toHaveBeenNthCalledWith(1, 1);
    expect(getSummary).toHaveBeenNthCalledWith(2, 2);
    expect(latest.providerStates[0]?.summary.count).toBe(2);

    await act(async () => resolveFirst({ count: 1 }));
    expect(latest.providerStates[0]?.summary.count).toBe(2);
  });

  it("keeps a single event subscription under React StrictMode effect replay", async () => {
    const getSummary = vi.fn(async () => ({ count: 1 }));
    vi.spyOn(AlertRegistry, "getProviders").mockReturnValue([createProvider(getSummary)]);
    root = createRoot(document.createElement("div"));

    await act(async () => {
      root?.render(
        <StrictMode>
          <FarmAlertsProvider farmId={12}>
            <Probe onValue={() => undefined} />
          </FarmAlertsProvider>
        </StrictMode>,
      );
    });
    const initialCalls = getSummary.mock.calls.length;

    await act(async () => AlertsEventBus.emit(12));
    expect(getSummary).toHaveBeenCalledTimes(initialCalls + 1);
  });
});
