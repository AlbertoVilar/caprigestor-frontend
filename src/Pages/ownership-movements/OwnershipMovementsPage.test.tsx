// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listOwnershipMovements } from "../../api/OwnershipMovementAPI/ownershipMovements";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import type {
  OwnershipMovementDTO,
  OwnershipMovementPageDTO,
} from "../../Models/OwnershipMovementDTOs";
import OwnershipMovementsPage from "./OwnershipMovementsPage";

vi.mock("../../api/OwnershipMovementAPI/ownershipMovements", () => ({
  listOwnershipMovements: vi.fn(),
}));
vi.mock("../../Hooks/useFarmPermissions", () => ({
  useFarmPermissions: vi.fn(),
}));

const mockedList = vi.mocked(listOwnershipMovements);
const mockedPermissions = vi.mocked(useFarmPermissions);
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const makeMovement = (overrides: Partial<OwnershipMovementDTO> = {}): OwnershipMovementDTO => ({
  movementId: 71,
  goatId: 55,
  goatName: null,
  goatRegistrationNumber: null,
  sourceFarmId: 19,
  sourceFarmName: null,
  targetFarmId: 1,
  targetFarmName: null,
  movementKind: "INTERNAL_TRANSFER",
  status: "COMPLETED",
  direction: "INCOMING",
  reason: "Transferência concluída",
  requestedAt: "2026-09-29T12:00:00Z",
  acceptedAt: "2026-09-29T12:30:00Z",
  effectiveAt: "2026-09-29T13:00:00Z",
  completedAt: "2026-09-29T13:00:00Z",
  cancelledAt: null,
  realized: true,
  saleId: null,
  saleDate: null,
  amount: null,
  paymentStatus: null,
  paymentDate: null,
  ...overrides,
});

const makePage = (
  content: OwnershipMovementDTO[] = [makeMovement()],
  overrides: Partial<OwnershipMovementPageDTO> = {},
): OwnershipMovementPageDTO => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  number: 0,
  size: 20,
  ...overrides,
});

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

describe("OwnershipMovementsPage", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPermissions.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: true,
      loading: false,
      error: null,
    } as ReturnType<typeof useFarmPermissions>);
    mockedList.mockResolvedValue(makePage());
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function renderPage() {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/19/ownership-movements"]}>
          <LocationProbe />
          <Routes>
            <Route path="/app/goatfarms/:farmId/ownership-movements" element={<OwnershipMovementsPage />} />
            <Route path="/403" element={<span>403</span>} />
          </Routes>
        </MemoryRouter>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("waits for farm administration capability before requesting movements", async () => {
    mockedPermissions.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: false,
      loading: true,
      error: null,
    } as ReturnType<typeof useFarmPermissions>);

    await renderPage();

    expect(container.textContent).toContain("Verificando permissões...");
    expect(mockedList).not.toHaveBeenCalled();
  });

  it.each(["denied", "permission request failure"])("redirects unauthorized users without querying the movement API (%s)", async (caseName) => {
    mockedPermissions.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: false,
      loading: false,
      error: caseName === "permission request failure" ? new Error("network") : null,
    } as ReturnType<typeof useFarmPermissions>);

    await renderPage();

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe("/403");
    expect(mockedList).not.toHaveBeenCalled();
  });

  it("loads incoming movements with default filters and falls back to technical IDs", async () => {
    await renderPage();

    expect(mockedList).toHaveBeenCalledWith(19, "INCOMING", undefined, undefined, 0, 20);
    expect(container.textContent).toContain("Movimentos de propriedade");
    expect(container.textContent).toContain("Animal #55");
    expect(container.textContent).toContain("Fazenda #19");
    expect(container.textContent).toContain("Fazenda #1");
    expect(container.textContent).toContain("Transferência entre fazendas");
    expect(container.textContent).toContain("Realizado");
    expect(container.textContent).not.toContain("Ações");
  });

  it("prefers animal and farm names while showing the animal registration", async () => {
    mockedList.mockResolvedValueOnce(makePage([makeMovement({
      goatName: "Isidra",
      goatRegistrationNumber: "12345",
      sourceFarmName: "Capril Bocaina",
      targetFarmName: "Capril Vilar",
    })]));

    await renderPage();

    expect(container.textContent).toContain("Isidra · RG 12345");
    expect(container.textContent).toContain("Capril Bocaina");
    expect(container.textContent).toContain("Capril Vilar");
    expect(container.textContent).not.toContain("Animal #55");
    expect(container.textContent).not.toContain("Fazenda #19");
  });

  it("renders every process status and uses realized independently", async () => {
    mockedList.mockResolvedValueOnce(makePage([
      makeMovement({ movementId: 1, status: "REQUESTED", realized: false }),
      makeMovement({ movementId: 2, status: "ACCEPTED", realized: false }),
      makeMovement({ movementId: 3, status: "COMPLETED", realized: true }),
      makeMovement({ movementId: 4, status: "REJECTED", realized: false }),
      makeMovement({ movementId: 5, status: "CANCELLED", realized: false }),
    ]));

    await renderPage();

    for (const label of ["Solicitado", "Aceito", "Concluído", "Rejeitado", "Cancelado"]) {
      expect(container.textContent).toContain(label);
    }
    expect(container.textContent).toContain("Realizado");
    expect(container.textContent).toContain("Pendente");
  });

  it("keeps paid sale, process status, and pending ownership movement separate", async () => {
    mockedList.mockResolvedValueOnce(makePage([makeMovement({
      movementKind: "INTERNAL_SALE",
      status: "REQUESTED",
      realized: false,
      reason: "Venda em teste",
      saleId: 88,
      saleDate: "2026-09-29",
      amount: 500,
      paymentStatus: "PAID",
      paymentDate: "2026-09-30",
    })]));

    await renderPage();

    expect(container.textContent).toContain("Venda entre fazendas");
    expect(container.textContent).toContain("Solicitado");
    expect(container.textContent).toContain("Pagamento: PAID");
    expect(container.textContent).toContain("Pendente");
    expect(container.textContent).toContain("Venda #88");
    expect(container.textContent).toContain("R$");
  });

  it("does not invent financial values for transfers with null sale enrichment", async () => {
    mockedList.mockResolvedValueOnce(makePage([makeMovement()]));

    await renderPage();

    expect(container.textContent).toContain("—");
    expect(container.textContent).not.toContain("R$ 0,00");
  });

  it("switches direction and forwards the new perspective", async () => {
    await renderPage();
    mockedList.mockResolvedValue(makePage([], { totalElements: 0, totalPages: 0 }));

    const outgoing = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Saída");
    await act(async () => {
      outgoing?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedList).toHaveBeenLastCalledWith(19, "OUTGOING", undefined, undefined, 0, 20);
  });

  it("filters by kind and status and resets pagination to the first page", async () => {
    mockedList.mockImplementation(async (_farmId, _direction, _status, _kind, requestedPage, size) =>
      makePage([makeMovement()], { totalElements: 42, totalPages: 3, number: requestedPage, size }),
    );
    await renderPage();

    const next = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Próxima");
    await act(async () => {
      next?.click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedList).toHaveBeenLastCalledWith(19, "INCOMING", undefined, undefined, 1, 20);

    const kind = container.querySelector("#ownership-movement-kind") as HTMLSelectElement;
    await act(async () => {
      kind.value = "INTERNAL_SALE";
      kind.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedList).toHaveBeenLastCalledWith(19, "INCOMING", undefined, "INTERNAL_SALE", 0, 20);

    const status = container.querySelector("#ownership-movement-status") as HTMLSelectElement;
    await act(async () => {
      status.value = "COMPLETED";
      status.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedList).toHaveBeenLastCalledWith(19, "INCOMING", "COMPLETED", "INTERNAL_SALE", 0, 20);
  });

  it("uses server page metadata and paginates without slicing locally", async () => {
    mockedList.mockImplementation(async (_farmId, _direction, _status, _kind, requestedPage, size) => {
      const effectivePage = requestedPage ?? 0;
      return makePage([makeMovement({ movementId: 100 + effectivePage })], {
        totalElements: 42,
        totalPages: 3,
        number: effectivePage,
        size,
      });
    });
    await renderPage();

    expect(container.textContent).toContain("Página 1 de 3");
    expect(container.textContent).toContain("42 movimento(s)");
    const next = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Próxima");
    await act(async () => {
      next?.click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedList).toHaveBeenLastCalledWith(19, "INCOMING", undefined, undefined, 1, 20);
    expect(container.textContent).toContain("Animal #55");
  });

  it("shows loading, explicit empty state, and selected-filter context", async () => {
    let resolve!: (value: OwnershipMovementPageDTO) => void;
    mockedList.mockReturnValueOnce(new Promise((res) => { resolve = res; }));
    await renderPage();
    expect(container.textContent).toContain("Carregando movimentos de propriedade...");

    await act(async () => {
      resolve(makePage([], { totalElements: 0, totalPages: 0 }));
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Nenhum movimento encontrado");
    expect(container.textContent).toContain("direção, tipo e status selecionados");
  });

  it("shows errors without stale rows and retries the same request", async () => {
    mockedList.mockRejectedValueOnce(new Error("network failure"));
    await renderPage();

    expect(container.textContent).toContain("Não foi possível carregar os movimentos de propriedade");
    expect(container.textContent).toContain("network failure");

    mockedList.mockResolvedValueOnce(makePage([makeMovement({ movementId: 72 })]));
    const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Tentar novamente");
    await act(async () => {
      retry?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("#72");
    expect(container.textContent).not.toContain("network failure");
  });
});
