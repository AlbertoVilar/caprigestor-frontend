// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import GoatOwnershipHistoryPanel from "./GoatOwnershipHistoryPanel";

const historyMock = vi.hoisted(() => vi.fn());

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../../api/GoatOwnershipAPI/ownershipHistory", () => ({
  getGoatOwnershipHistory: historyMock,
  isValidStructuralGoatId: (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value > 0,
}));

describe("GoatOwnershipHistoryPanel", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    vi.clearAllMocks();
  });

  it("loads once on expansion and preserves canonical order", async () => {
    historyMock.mockResolvedValueOnce({
      goatId: 42,
      periods: [
        { farmId: 10, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-02-01T00:00:00Z", entryType: "BIRTH", exitType: "TRANSFER_OUT", current: false },
        { farmId: 20, startedAt: "2025-02-01T00:00:00Z", endedAt: null, entryType: "TRANSFER_IN", exitType: null, current: true },
      ],
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
    expect(historyMock).not.toHaveBeenCalled();
    const toggle = () => container.querySelector("button") as HTMLButtonElement;
    await act(async () => toggle().click());

    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Nascimento");
    expect(container.textContent).toContain("Fazenda #10");
    expect(container.textContent).toContain("Proprietário atual");
    expect(historyMock).toHaveBeenCalledTimes(1);

    await act(async () => toggle().click());
    await act(async () => toggle().click());
    expect(historyMock).toHaveBeenCalledTimes(1);
  });

  it("does not call HTTP and shows an unavailable state without structural id", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={undefined} />));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    expect(container.textContent).toMatch(/identificador estrutural do animal não encontrado/i);
    expect(historyMock).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity])(
    "fails closed for invalid numeric structural ID %s",
    async (invalidGoatId) => {
      historyMock.mockResolvedValueOnce({
        goatId: 42,
        periods: [
          {
            farmId: 42,
            startedAt: "2025-01-01T00:00:00Z",
            endedAt: null,
            entryType: "BIRTH",
            exitType: null,
            current: true,
          },
        ],
      });

      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
      await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
      await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
      await act(async () => await Promise.resolve());
      expect(container.textContent).toContain("Fazenda #42");

      await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={invalidGoatId} />));
      expect(container.textContent).not.toContain("Fazenda #42");
      const callsBeforeInvalidExpansion = historyMock.mock.calls.length;

      await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
      expect(container.textContent).toContain("Histórico de propriedade indisponível: identificador estrutural do animal não encontrado.");
      expect(container.textContent).not.toContain("Fazenda #42");
      expect(historyMock).toHaveBeenCalledTimes(callsBeforeInvalidExpansion);
    },
  );

  it("shows the neutral profile message for backend 403", async () => {
    historyMock.mockRejectedValueOnce({ response: { status: 403 } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Histórico de propriedade indisponível para este perfil.");
  });

  it("renders canonical consistency errors with a retry action", async () => {
    historyMock.mockRejectedValueOnce({ response: { status: 422 } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Dados canônicos indisponíveis");
    expect(container.textContent).toContain("Tentar novamente");
    historyMock.mockResolvedValueOnce({ goatId: 42, periods: [] });
    const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Tentar novamente"));
    await act(async () => retry?.click());
    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Nenhum período de propriedade");
    expect(historyMock).toHaveBeenCalledTimes(2);
  });

  it("ignores a stale response when the structural GoatId changes", async () => {
    const pending = new Map<number, (value: unknown) => void>();
    historyMock.mockImplementation((goatId: number) =>
      new Promise((resolve) => pending.set(goatId, resolve)),
    );

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    expect(historyMock).toHaveBeenCalledWith(42);

    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={84} />));
    expect(container.textContent).not.toContain("Fazenda #42");

    await act(async () => {
      pending.get(42)?.({
        goatId: 42,
        periods: [
          {
            farmId: 42,
            startedAt: "2025-01-01T00:00:00Z",
            endedAt: null,
            entryType: "BIRTH",
            exitType: null,
            current: true,
          },
        ],
      });
      await Promise.resolve();
    });
    expect(container.textContent).not.toContain("Fazenda #42");

    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    expect(historyMock).toHaveBeenNthCalledWith(2, 84);

    await act(async () => {
      pending.get(84)?.({
        goatId: 84,
        periods: [
          {
            farmId: 84,
            startedAt: "2025-02-01T00:00:00Z",
            endedAt: null,
            entryType: "MANUAL_IMPORT",
            exitType: null,
            current: true,
          },
        ],
      });
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Fazenda #84");
    expect(container.textContent).not.toContain("Fazenda #42");
  });

  it("ignores a stale rejection when the structural GoatId changes", async () => {
    const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();
    historyMock.mockImplementation((goatId: number) =>
      new Promise((resolve, reject) => pending.set(goatId, { resolve, reject })),
    );

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={84} />));

    await act(async () => {
      pending.get(42)?.reject({ response: { status: 500 } });
      await Promise.resolve();
    });
    expect(container.textContent).not.toContain("Não foi possível carregar o histórico");
    expect(container.textContent).not.toContain("Tentar novamente");
  });

  it("does not render already-loaded history after changing the structural GoatId", async () => {
    historyMock.mockResolvedValueOnce({
      goatId: 42,
      periods: [
        {
          farmId: 42,
          startedAt: "2025-01-01T00:00:00Z",
          endedAt: null,
          entryType: "BIRTH",
          exitType: null,
          current: true,
        },
      ],
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Fazenda #42");

    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={84} />));
    expect(container.textContent).not.toContain("Fazenda #42");

    historyMock.mockResolvedValueOnce({
      goatId: 84,
      periods: [
        {
          farmId: 84,
          startedAt: "2025-02-01T00:00:00Z",
          endedAt: null,
          entryType: "MANUAL_IMPORT",
          exitType: null,
          current: true,
        },
      ],
    });
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Fazenda #84");
    expect(container.textContent).not.toContain("Fazenda #42");
  });

  it("shows a safe not-found state for backend 404", async () => {
    historyMock.mockRejectedValueOnce({ response: { status: 404 } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Animal não encontrado para consulta.");
    expect(container.textContent).not.toContain("Fazenda #");
  });

  it("renders a retryable network or 5xx error and retries", async () => {
    historyMock.mockRejectedValueOnce({ response: { status: 500 } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoatOwnershipHistoryPanel goatId={42} />));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Tentar novamente");

    historyMock.mockResolvedValueOnce({ goatId: 42, periods: [] });
    const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Tentar novamente"));
    await act(async () => retry?.click());
    await act(async () => await Promise.resolve());
    expect(container.textContent).toContain("Nenhum período de propriedade");
    expect(historyMock).toHaveBeenCalledTimes(2);
  });
});
