// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoatRegistrationRectificationDialog, {
  GoatRegistrationHistoryModal,
} from "./GoatRegistrationRectificationDialog";
import { deriveRegistrationPreview } from "./registrationIdentity";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

const rectifyMock = vi.hoisted(() => vi.fn());
const historyMock = vi.hoisted(() => vi.fn());

vi.mock("../../api/GoatAPI/goat", () => ({
  rectifyGoatRegistration: rectifyMock,
  fetchGoatRegistrationHistory: historyMock,
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const goat: GoatResponseDTO = {
  technicalId: 99,
  id: 99,
  registrationNumber: "1643218012",
  name: "Matriz de teste",
  breed: "SAANEN",
  color: "Branca",
  gender: "Fêmea",
  birthDate: "2025-01-07",
  status: "Ativo",
  category: "PO",
  tod: "16432",
  toe: "18012",
  farmId: 42,
};

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = input instanceof HTMLTextAreaElement
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("GoatRegistrationRectificationDialog", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    rectifyMock.mockResolvedValue({
      technicalGoatId: 99,
      previousRegistrationNumber: "1643218012",
      previousTod: "16432",
      previousToe: "18012",
      currentRegistrationNumber: "1643226001",
      currentTod: "16432",
      currentToe: "26001",
      source: "ABCC",
      changedAt: "2026-09-11T12:00:00",
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("normalizes TOD and TOE only for the derived preview", () => {
    expect(deriveRegistrationPreview(" 164 32 ", "26001 ")).toBe("16432 26001".replace(" ", ""));
    expect(deriveRegistrationPreview("ab 01", " cd02")).toBe("AB01CD02");
  });

  it("shows current identity, derived RG preview and never an editable RG field", async () => {
    await act(async () => {
      root.render(
        <GoatRegistrationRectificationDialog
          goat={goat}
          farmId={42}
          goatRouteId="technical-99"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );
    });

    expect(document.body.textContent).toContain("1643218012");
    expect(document.body.textContent).toContain("1643218012");
    expect(document.body.textContent).toContain("Prévia do novo RG");
    expect(document.querySelector('input[placeholder="Ex.: ABCC-2026-001"]')).not.toBeNull();
    expect(document.querySelector('input[name="registrationNumber"]')).toBeNull();
  });

  it("requires evidence and reason before confirmation and sends the corrected payload", async () => {
    const onSuccess = vi.fn();
    await act(async () => {
      root.render(
        <GoatRegistrationRectificationDialog
          goat={goat}
          farmId={42}
          goatRouteId="technical-99"
          onClose={() => {}}
          onSuccess={onSuccess}
        />
      );
    });

    const inputs = document.querySelectorAll("input");
    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, "16432");
      setInputValue(inputs[1] as HTMLInputElement, "26001");
      const select = document.querySelector("select") as HTMLSelectElement;
      select.value = "ABCC";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      setInputValue(document.querySelector('input[placeholder="Ex.: ABCC-2026-001"]') as HTMLInputElement, "ABCC-2026-001");
      setInputValue(document.querySelector("textarea") as HTMLTextAreaElement, "Correção oficial conferida.");
    });

    const reviewButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Revisar correção"));
    await act(async () => reviewButton?.click());
    expect(document.body.textContent).toContain("1643218012 → 1643226001");

    const confirmButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Confirmar retificação"));
    await act(async () => confirmButton?.click());

    expect(rectifyMock).toHaveBeenCalledWith(42, "technical-99", {
      tod: "16432",
      toe: "26001",
      source: "ABCC",
      evidenceReference: "ABCC-2026-001",
      reason: "Correção oficial conferida.",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("does not allow an identical identity or incomplete evidence", async () => {
    await act(async () => {
      root.render(
        <GoatRegistrationRectificationDialog
          goat={goat}
          farmId={42}
          goatRouteId="technical-99"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );
    });

    const reviewButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Revisar correção"));
    await act(async () => reviewButton?.click());
    expect(document.body.textContent).toContain("Selecione a origem da correção.");

    const select = document.querySelector("select") as HTMLSelectElement;
    const evidence = document.querySelector('input[placeholder="Ex.: ABCC-2026-001"]') as HTMLInputElement;
    const reason = document.querySelector("textarea") as HTMLTextAreaElement;
    await act(async () => {
      select.value = "ABCC";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      setInputValue(evidence, "ABCC-OLD");
      setInputValue(reason, "Conferência");
    });

    await act(async () => reviewButton?.click());
    expect(document.body.textContent).toContain("A nova identidade precisa ser diferente da atual.");
    expect(rectifyMock).not.toHaveBeenCalled();
  });

  it("presents a conflict without changing local state", async () => {
    rectifyMock.mockRejectedValueOnce({ response: { status: 409, data: {} } });

    await act(async () => {
      root.render(
        <GoatRegistrationRectificationDialog
          goat={goat}
          farmId={42}
          goatRouteId="technical-99"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );
    });

    const inputs = document.querySelectorAll("input");
    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, "16432");
      setInputValue(inputs[1] as HTMLInputElement, "26001");
      const select = document.querySelector("select") as HTMLSelectElement;
      select.value = "ABCC";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      setInputValue(document.querySelector('input[placeholder="Ex.: ABCC-2026-001"]') as HTMLInputElement, "ABCC-2026-001");
      setInputValue(document.querySelector("textarea") as HTMLTextAreaElement, "Conferência");
    });

    await act(async () => Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Revisar correção"))?.click());
    await act(async () => Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Confirmar retificação"))?.click());
    expect(document.body.textContent).toContain("já está em uso por outra cabra");
  });

  it("renders management history returned by the private endpoint", async () => {
    historyMock.mockResolvedValueOnce([{
      id: 1,
      technicalGoatId: 99,
      farmId: 42,
      oldRegistrationNumber: "1643218012",
      oldTod: "16432",
      oldToe: "18012",
      newRegistrationNumber: "1643226001",
      newTod: "16432",
      newToe: "26001",
      source: "ABCC",
      evidenceReference: "ABCC-2026-001",
      reason: "Conferência oficial",
      actorUserId: 7,
      createdAt: "2026-09-11T12:00:00",
    }]);

    await act(async () => {
      root.render(<GoatRegistrationHistoryModal farmId={42} goatRouteId="technical-99" onClose={() => {}} />);
    });
    await act(async () => { await Promise.resolve(); });

    expect(document.body.textContent).toContain("1643218012 → 1643226001");
    expect(document.body.textContent).toContain("Conferência oficial");
  });

  it("shows a safe error state when history access fails", async () => {
    historyMock.mockRejectedValueOnce({ response: { status: 403, data: {} } });
    await act(async () => {
      root.render(<GoatRegistrationHistoryModal farmId={42} goatRouteId="technical-99" onClose={() => {}} />);
    });
    await act(async () => { await Promise.resolve(); });

    expect(document.body.textContent).toContain("Não foi possível carregar o histórico");
    expect(document.body.textContent).toContain("Acesso negado");
  });
});
