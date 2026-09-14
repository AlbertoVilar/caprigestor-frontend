// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnershipTransferPage from "./OwnershipTransferPage";
import {
  acceptOwnershipTransfer,
  cancelOwnershipTransfer,
  listOwnershipTransfers,
  rejectOwnershipTransfer,
} from "../../api/OwnershipTransferAPI/ownershipTransfer";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";

vi.mock("../../api/OwnershipTransferAPI/ownershipTransfer", () => ({
  acceptOwnershipTransfer: vi.fn(),
  cancelOwnershipTransfer: vi.fn(),
  listOwnershipTransfers: vi.fn(),
  rejectOwnershipTransfer: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../Hooks/useFarmPermissions", () => ({
  useFarmPermissions: vi.fn(),
}));

const mockedListTransfers = vi.mocked(listOwnershipTransfers);
const mockedAcceptTransfer = vi.mocked(acceptOwnershipTransfer);
const mockedRejectTransfer = vi.mocked(rejectOwnershipTransfer);
const mockedCancelTransfer = vi.mocked(cancelOwnershipTransfer);
const mockedPermissions = vi.mocked(useFarmPermissions);

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const transfer = {
  id: 900,
  goatId: 123,
  sourceFarmId: 10,
  targetFarmId: 45,
  kind: "INTERNAL_TRANSFER" as const,
  status: "REQUESTED" as const,
  reason: "Transfer between farms",
  requestedAt: "2026-09-14T12:00:00Z",
  acceptedAt: null,
  effectiveAt: null,
  completedAt: null,
  cancelledAt: null,
};

const page = (overrides: Partial<Awaited<ReturnType<typeof listOwnershipTransfers>>> = {}) => ({
  content: [transfer],
  totalElements: 2,
  totalPages: 2,
  number: 0,
  size: 10,
  ...overrides,
});

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

describe("OwnershipTransferPage", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPermissions.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: true,
      loading: false,
    } as ReturnType<typeof useFarmPermissions>);
    mockedListTransfers.mockResolvedValue(page());
    mockedAcceptTransfer.mockResolvedValue(transfer);
    mockedRejectTransfer.mockResolvedValue(transfer);
    mockedCancelTransfer.mockResolvedValue(transfer);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  async function renderPage() {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/45/ownership-transfers"]}>
          <LocationProbe />
          <Routes>
            <Route path="/app/goatfarms/:farmId/ownership-transfers" element={<OwnershipTransferPage />} />
            <Route path="/403" element={<span>403</span>} />
          </Routes>
        </MemoryRouter>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("waits for farm capability before querying", async () => {
    mockedPermissions.mockReturnValue({
      canOperateFarm: false,
      canAdministerFarm: false,
      loading: true,
    } as ReturnType<typeof useFarmPermissions>);

    await renderPage();

    expect(mockedListTransfers).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Verificando permissões...");
  });

  it("redirects a farm user without administrative capability to 403", async () => {
    mockedPermissions.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: false,
      loading: false,
    } as ReturnType<typeof useFarmPermissions>);

    await renderPage();

    expect(mockedListTransfers).not.toHaveBeenCalled();
    expect(container.querySelector("[data-testid=location]")?.textContent).toBe("/403");
  });

  it("loads incoming transfers without a status filter and renders read-only data", async () => {
    await renderPage();

    expect(mockedListTransfers).toHaveBeenCalledWith(45, "INCOMING", undefined, 0, 10);
    expect(container.textContent).toContain("Entrada");
    expect(container.textContent).toContain("#123");
    expect(container.textContent).toContain("Fazenda #10");
    expect(container.textContent).toContain("Transfer between farms");
    expect(container.querySelector("button")).toBeTruthy();
    expect(container.textContent).toContain("Ações");
  });

  it("switches to outgoing and forwards the selected status", async () => {
    await renderPage();
    mockedListTransfers.mockResolvedValue(page({ content: [] }));

    const outgoing = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Saída");
    await act(async () => {
      outgoing?.click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedListTransfers).toHaveBeenLastCalledWith(45, "OUTGOING", undefined, 0, 10);

    const status = container.querySelector("#ownership-transfer-status") as HTMLSelectElement;
    await act(async () => {
      status.value = "COMPLETED";
      status.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedListTransfers).toHaveBeenLastCalledWith(45, "OUTGOING", "COMPLETED", 0, 10);
  });

  it("uses backend-driven pagination", async () => {
    await renderPage();
    const next = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Próxima");

    await act(async () => {
      next?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedListTransfers).toHaveBeenLastCalledWith(45, "INCOMING", undefined, 1, 10);
  });

  it("renders an explicit empty state", async () => {
    mockedListTransfers.mockResolvedValueOnce(page({ content: [], totalElements: 0, totalPages: 0 }));

    await renderPage();

    expect(container.textContent).toContain("Nenhuma transferência encontrada");
  });

  it("renders an explicit error state with retry", async () => {
    mockedListTransfers.mockRejectedValueOnce(new Error("network"));

    await renderPage();

    expect(container.textContent).toContain("Não foi possível carregar as transferências");
    expect(container.textContent).toContain("network");
  });

  it("shows accept and reject only for incoming requested transfers", async () => {
    await renderPage();

    expect(container.textContent).toContain("Aceitar");
    expect(container.textContent).toContain("Rejeitar");
    expect(container.textContent).not.toContain("Cancelar");
  });

  it("accepts a requested incoming transfer and refetches the current query", async () => {
    await renderPage();
    mockedListTransfers.mockResolvedValue(page());

    const accept = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Aceitar");
    await act(async () => {
      accept?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedAcceptTransfer).toHaveBeenCalledWith(900);
    expect(mockedListTransfers).toHaveBeenLastCalledWith(45, "INCOMING", undefined, 0, 10);
  });

  it("does not call a mutation when confirmation is declined", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    await renderPage();

    const accept = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Aceitar");
    await act(async () => {
      accept?.click();
      await Promise.resolve();
    });

    expect(mockedAcceptTransfer).not.toHaveBeenCalled();
  });

  it("shows only cancel for outgoing requested transfers", async () => {
    await renderPage();
    const outgoing = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Saída");
    await act(async () => {
      outgoing?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Cancelar");
    expect(container.textContent).not.toContain("Aceitar");
    expect(container.textContent).not.toContain("Rejeitar");
  });

  it("cancels a requested outgoing transfer and refetches the current query", async () => {
    await renderPage();
    const outgoing = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Saída");
    await act(async () => {
      outgoing?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    const cancel = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Cancelar");
    await act(async () => {
      cancel?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedCancelTransfer).toHaveBeenCalledWith(900);
    expect(mockedListTransfers).toHaveBeenLastCalledWith(45, "OUTGOING", undefined, 0, 10);
  });

  it("rejects an incoming transfer through the dedicated client operation", async () => {
    await renderPage();
    const reject = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Rejeitar");
    await act(async () => {
      reject?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedRejectTransfer).toHaveBeenCalledWith(900);
  });

  it("does not show actions for terminal transfer statuses", async () => {
    mockedListTransfers.mockResolvedValueOnce(page({ content: [{ ...transfer, status: "COMPLETED" }] }));
    await renderPage();

    expect(container.textContent).not.toContain("Aceitar");
    expect(container.textContent).not.toContain("Rejeitar");
    expect(container.textContent).not.toContain("Cancelar");
  });

  it("prevents a second action while the first mutation is pending", async () => {
    let resolveAccept: (value: typeof transfer) => void = () => undefined;
    mockedAcceptTransfer.mockReturnValueOnce(new Promise((resolve) => { resolveAccept = resolve; }));
    await renderPage();

    const accept = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Aceitar") as HTMLButtonElement;
    await act(async () => {
      accept.click();
      await Promise.resolve();
    });
    expect(accept.disabled).toBe(true);
    expect(mockedAcceptTransfer).toHaveBeenCalledTimes(1);

    await act(async () => {
      accept.click();
      resolveAccept(transfer);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedAcceptTransfer).toHaveBeenCalledTimes(1);
  });
});
