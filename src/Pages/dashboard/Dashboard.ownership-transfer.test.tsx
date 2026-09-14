// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnimalDashboard from "./Dashboard";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

const apiMocks = vi.hoisted(() => ({
  getAllFarms: vi.fn(),
  getGoatFarmById: vi.fn(),
  requestInternalTransfer: vi.fn(),
  exitGoat: vi.fn(),
  fetchGoatById: vi.fn(),
  findGoatsByFarmAndName: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({
  getAllFarms: apiMocks.getAllFarms,
  getGoatFarmById: apiMocks.getGoatFarmById,
}));
vi.mock("../../api/OwnershipTransferAPI/ownershipTransfer", () => ({
  requestInternalTransfer: apiMocks.requestInternalTransfer,
}));
vi.mock("../../api/GoatAPI/goat", () => ({
  exitGoat: apiMocks.exitGoat,
  fetchGoatById: apiMocks.fetchGoatById,
  findGoatsByFarmAndName: apiMocks.findGoatsByFarmAndName,
}));
vi.mock("../../Hooks/useFarmPermissions", () => ({
  useFarmPermissions: () => ({ canOperateFarm: true, canAdministerFarm: true, loading: false }),
}));
vi.mock("../../Components/dash-animal-info/GoatActionPanel", () => ({
  default: ({ onRequestOwnershipTransfer }: { onRequestOwnershipTransfer?: () => void }) => (
    <button type="button" onClick={onRequestOwnershipTransfer}>Transferir propriedade</button>
  ),
}));
vi.mock("../../Components/goat-info-card/GoatInfoCard", () => ({ default: () => <div /> }));
vi.mock("../../Components/goat-operational-history/GoatOperationalHistoryPanel", () => ({ default: () => <div /> }));
vi.mock("../../Components/goat-registration/GoatRegistrationRectificationDialog", () => ({
  default: () => null,
  GoatRegistrationHistoryModal: () => null,
}));
vi.mock("../../Components/goat-event-form/GoatEventModal", () => ({ default: () => null }));
vi.mock("../../Components/searchs/SearchInputBox", () => ({ default: () => <div /> }));
vi.mock("../../Components/goat-card-list/GoatCardList", () => ({ default: () => <div /> }));
vi.mock("../../Components/pages-headers/ContextBreadcrumb", () => ({ default: () => <div /> }));
vi.mock("react-toastify", () => ({ toast: apiMocks.toast }));

const farm = (id: number, name: string): GoatFarmDTO => ({
  id, name, tod: "TOD", createdAt: "", updatedAt: "", userId: 1, userName: "", userEmail: "", userCpf: "",
  addressId: 1, street: "", district: "", city: "", state: "", cep: "", phones: [],
});

const baseGoat: GoatResponseDTO = {
  technicalId: 41, id: 7, registrationNumber: "RG-41", name: "Cabra", breed: "Saanen", color: "Branca",
  gender: "FEMALE", birthDate: "2025-01-01", status: "ATIVO", category: "PO", toe: "1", tod: "2", farmId: 12,
};

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function renderDashboard(goat: GoatResponseDTO = baseGoat) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[{
        pathname: "/app/goatfarms/12/goats/technical-41",
        state: { goat, farmId: 12 },
      }]}>
        <Routes>
          <Route path="*" element={<AnimalDashboard />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  await act(async () => { await Promise.resolve(); });
}

async function openTransferModal() {
  const button = Array.from(container?.querySelectorAll("button") ?? [])
    .find((candidate) => candidate.textContent?.includes("Transferir propriedade"));
  expect(button).toBeTruthy();
  await act(async () => { button?.click(); });
  await act(async () => { await Promise.resolve(); });
}

async function fillTransfer(targetFarmId: string, reason: string) {
  const select = container?.querySelector("#ownership-transfer-target") as HTMLSelectElement;
  const textarea = container?.querySelector("#ownership-transfer-reason") as HTMLTextAreaElement;
  await act(async () => {
    const selectSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    const textareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    selectSetter?.call(select, targetFarmId);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    textareaSetter?.call(textarea, reason);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
  });
}

async function submitTransfer() {
  const button = Array.from(container?.querySelectorAll("button") ?? [])
    .find((candidate) => candidate.textContent?.includes("Enviar solicitação"));
  expect(button).toBeTruthy();
  await act(async () => {
    button?.click();
    await Promise.resolve();
  });
}

describe("AnimalDashboard ownership transfer request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getAllFarms.mockResolvedValue([farm(12, "Origem"), farm(42, "Destino"), farm(43, "Outra")]);
    apiMocks.getGoatFarmById.mockResolvedValue(farm(12, "Origem"));
    apiMocks.findGoatsByFarmAndName.mockResolvedValue([]);
    apiMocks.requestInternalTransfer.mockResolvedValue({ id: 1 });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(async () => {
    await act(async () => { root?.unmount(); });
    container?.remove();
    root = undefined;
    container = undefined;
    vi.restoreAllMocks();
  });

  it("submits technicalId with the correct target/reason and no sourceFarmId", async () => {
    await renderDashboard();
    await openTransferModal();
    await fillTransfer("42", "  venda entre fazendas  ");
    await submitTransfer();
    await act(async () => { await Promise.resolve(); });

    expect(apiMocks.requestInternalTransfer).toHaveBeenCalledWith(expect.objectContaining({
      goatId: 41, targetFarmId: 42, reason: "venda entre fazendas",
      idempotencyKey: expect.any(String),
    }));
    expect(apiMocks.requestInternalTransfer.mock.calls[0][0]).not.toHaveProperty("sourceFarmId");
    expect(apiMocks.exitGoat).not.toHaveBeenCalled();
    expect(container?.querySelector("#ownership-transfer-title")).toBeNull();
  });

  it("blocks invalid destination, empty reason and declined confirmation", async () => {
    await renderDashboard();
    await openTransferModal();
    await fillTransfer("12", "");
    await submitTransfer();
    expect(apiMocks.requestInternalTransfer).not.toHaveBeenCalled();
    expect(container?.textContent).toContain("fazenda de destino diferente");

    await fillTransfer("42", "");
    await submitTransfer();
    expect(apiMocks.requestInternalTransfer).not.toHaveBeenCalled();
    expect(container?.textContent).toContain("Informe o motivo");

    await fillTransfer("42", "motivo");
    vi.mocked(window.confirm).mockReturnValue(false);
    await submitTransfer();
    expect(apiMocks.requestInternalTransfer).not.toHaveBeenCalled();
  });

  it("reuses idempotency on retry, changes it when intent changes and preserves fields after failure", async () => {
    apiMocks.requestInternalTransfer.mockRejectedValueOnce(new Error("network"));
    await renderDashboard();
    await openTransferModal();
    await fillTransfer("42", "motivo inicial");
    await submitTransfer();
    await act(async () => { await Promise.resolve(); });
    const firstKey = apiMocks.requestInternalTransfer.mock.calls[0][0].idempotencyKey;
    expect((container?.querySelector("#ownership-transfer-target") as HTMLSelectElement).value).toBe("42");
    expect((container?.querySelector("#ownership-transfer-reason") as HTMLTextAreaElement).value).toBe("motivo inicial");

    apiMocks.requestInternalTransfer.mockResolvedValueOnce({ id: 2 });
    await submitTransfer();
    await act(async () => { await Promise.resolve(); });
    expect(apiMocks.requestInternalTransfer.mock.calls[1][0].idempotencyKey).toBe(firstKey);

    await openTransferModal();
    await fillTransfer("42", "motivo novo");
    apiMocks.requestInternalTransfer.mockRejectedValueOnce(new Error("network"));
    await submitTransfer();
    await act(async () => { await Promise.resolve(); });
    expect(apiMocks.requestInternalTransfer.mock.calls[2][0].idempotencyKey).not.toBe(firstKey);
  });

  it("does not issue a second mutation while the first request is pending", async () => {
    let resolveRequest: (() => void) | undefined;
    apiMocks.requestInternalTransfer.mockImplementation(
      () => new Promise<void>((resolve) => { resolveRequest = resolve; }),
    );
    await renderDashboard();
    await openTransferModal();
    await fillTransfer("42", "motivo");
    const submitButton = Array.from(container?.querySelectorAll("button") ?? [])
      .find((candidate) => candidate.textContent?.includes("Enviar solicitação"));
    await act(async () => { submitButton?.click(); });
    await act(async () => { submitButton?.click(); });

    expect(apiMocks.requestInternalTransfer).toHaveBeenCalledTimes(1);
    await act(async () => { resolveRequest?.(); await Promise.resolve(); });
  });

  it("uses id fallback and blocks submission when no structural id exists", async () => {
    await renderDashboard({ ...baseGoat, technicalId: undefined, id: 7 });
    await openTransferModal();
    await fillTransfer("42", "fallback");
    await submitTransfer();
    await act(async () => { await Promise.resolve(); });
    expect(apiMocks.requestInternalTransfer.mock.calls[0][0].goatId).toBe(7);

    await act(async () => { root?.unmount(); });
    container?.remove();
    root = undefined;
    container = undefined;
    await renderDashboard({ ...baseGoat, technicalId: undefined, id: undefined });
    const renderedContainer = document.body.lastElementChild as HTMLDivElement;
    const missingButton = Array.from(renderedContainer.querySelectorAll("button"))
      .find((candidate) => candidate.textContent?.includes("Transferir propriedade"));
    await act(async () => { missingButton?.click(); });
    expect(apiMocks.getAllFarms).toHaveBeenCalledTimes(1);
    expect(apiMocks.toast.error).toHaveBeenCalledWith(expect.stringContaining("identificador estrutural"));
  });
});
