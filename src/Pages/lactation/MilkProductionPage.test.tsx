// @vitest-environment jsdom

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MilkProductionPage from "./MilkProductionPage";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { createMilkProduction, listMilkProductions } from "../../api/GoatFarmAPI/milkProduction";

vi.mock("../../api/GoatAPI/goat", () => ({ fetchGoatById: vi.fn() }));
vi.mock("../../api/GoatFarmAPI/health", () => ({
  healthAPI: { getWithdrawalStatus: vi.fn() },
}));
vi.mock("../../api/GoatFarmAPI/milkProduction", () => ({
  cancelMilkProduction: vi.fn(),
  createMilkProduction: vi.fn(),
  getMilkProductionById: vi.fn(),
  listMilkProductions: vi.fn(),
  patchMilkProduction: vi.fn(),
}));
vi.mock("../../Hooks/useFarmPermissions", () => ({
  useFarmPermissions: () => ({ canManageMilkProduction: true, loading: false }),
}));
vi.mock("react-toastify", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const mockedFetchGoat = vi.mocked(fetchGoatById);
const mockedWithdrawalStatus = vi.mocked(healthAPI.getWithdrawalStatus);
const mockedList = vi.mocked(listMilkProductions);
const mockedCreate = vi.mocked(createMilkProduction);

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("MilkProductionPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mockedFetchGoat.mockResolvedValue({ name: "Cabrita Teste" } as never);
    mockedWithdrawalStatus.mockResolvedValue({ hasActiveMilkWithdrawal: false } as never);
    mockedList.mockResolvedValue({ content: [], totalPages: 0, totalElements: 0 } as never);
    mockedCreate.mockResolvedValue({ recordedDuringMilkWithdrawal: false } as never);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    mockedFetchGoat.mockReset();
    mockedWithdrawalStatus.mockReset();
    mockedList.mockReset();
    mockedCreate.mockReset();
    await act(async () => root.unmount());
    container.remove();
  });

  it("starts the volume field empty and submits the typed numeric value", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/goats/technical-94/milk-productions"]}>
          <Routes>
            <Route
              path="/app/goatfarms/:farmId/goats/:goatId/milk-productions"
              element={<MilkProductionPage />}
            />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const registerButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Registrar produção")
    ) as HTMLButtonElement;

    await act(async () => {
      registerButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const volumeInput = document.body.querySelector("#milk-form-volume") as HTMLInputElement;
    expect(volumeInput.value).toBe("");

    await act(async () => {
      setInputValue(volumeInput, "12.5");
    });

    const saveButton = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.trim() === "Salvar"
    ) as HTMLButtonElement;

    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedCreate).toHaveBeenCalledWith(14, "technical-94", {
      date: expect.any(String),
      shift: "TOTAL_DAY",
      volumeLiters: 12.5,
      notes: undefined,
    });
  });
});
