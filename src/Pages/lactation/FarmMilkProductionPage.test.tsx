// @vitest-environment jsdom

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FarmMilkProductionPage from "./FarmMilkProductionPage";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import {
  getFarmMilkProductionAnnualSummary,
  getFarmMilkProductionDailySummary,
  getFarmMilkProductionMonthlySummary,
  upsertFarmMilkProductionDaily,
} from "../../api/GoatFarmAPI/farmMilkProduction";

vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({
  getGoatFarmById: vi.fn(),
}));

vi.mock("../../api/GoatFarmAPI/farmMilkProduction", () => ({
  getFarmMilkProductionAnnualSummary: vi.fn(),
  getFarmMilkProductionDailySummary: vi.fn(),
  getFarmMilkProductionMonthlySummary: vi.fn(),
  upsertFarmMilkProductionDaily: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockedGetFarmById = vi.mocked(getGoatFarmById);
const mockedGetDaily = vi.mocked(getFarmMilkProductionDailySummary);
const mockedGetMonthly = vi.mocked(getFarmMilkProductionMonthlySummary);
const mockedGetAnnual = vi.mocked(getFarmMilkProductionAnnualSummary);
const mockedUpsert = vi.mocked(upsertFarmMilkProductionDaily);

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value"
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("FarmMilkProductionPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mockedGetFarmById.mockResolvedValue({
      id: 17,
      name: "Capril Teste Fluxo Repro 20260317",
    } as never);
    mockedGetDaily.mockResolvedValue({
      productionDate: "2026-03-30",
      registered: true,
      totalProduced: 120,
      withdrawalProduced: 20,
      marketableProduced: 100,
      notes: "Leite em carencia separado",
      updatedAt: "2026-03-30T10:15:00",
    } as never);
    mockedGetMonthly.mockResolvedValue({
      year: 2026,
      month: 3,
      totalProduced: 3600,
      withdrawalProduced: 300,
      marketableProduced: 3300,
      daysRegistered: 30,
      dailyRecords: [
        {
          productionDate: "2026-03-30",
          totalProduced: 120,
          withdrawalProduced: 20,
          marketableProduced: 100,
          notes: "Leite em carencia separado",
        },
      ],
    } as never);
    mockedGetAnnual.mockResolvedValue({
      year: 2026,
      totalProduced: 12400,
      withdrawalProduced: 800,
      marketableProduced: 11600,
      daysRegistered: 90,
      monthlyRecords: [
        {
          month: 3,
          totalProduced: 3600,
          withdrawalProduced: 300,
          marketableProduced: 3300,
          daysRegistered: 30,
        },
      ],
    } as never);
    mockedUpsert.mockResolvedValue({
      productionDate: "2026-03-30",
      registered: true,
      totalProduced: 140,
      withdrawalProduced: 15,
      marketableProduced: 125,
      notes: "Ajuste operacional",
      updatedAt: "2026-03-30T11:00:00",
    } as never);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    mockedGetFarmById.mockReset();
    mockedGetDaily.mockReset();
    mockedGetMonthly.mockReset();
    mockedGetAnnual.mockReset();
    mockedUpsert.mockReset();
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders daily, monthly and annual sections for the farm consolidated production", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/17/milk-consolidated"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId/milk-consolidated" element={<FarmMilkProductionPage />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Produção consolidada da fazenda");
    expect(container.textContent).toContain("Semântica do consolidado");
    expect(container.textContent).toContain("Visão diária");
    expect(container.textContent).toContain("Visão mensal");
    expect(container.textContent).toContain("Visão anual");
    expect(container.textContent).toContain("120,00 L");
    expect(container.textContent).toContain("3600,00 L");
    expect(container.textContent).toContain("300,00 L");
    expect(container.textContent).toContain("3300,00 L");
  });

  it("submits the daily consolidated form", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/17/milk-consolidated"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId/milk-consolidated" element={<FarmMilkProductionPage />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const formInputs = container.querySelectorAll(".farm-milk-form input");
    const textarea = container.querySelector(".farm-milk-form textarea") as HTMLTextAreaElement;
    const saveButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Salvar dia")
    ) as HTMLButtonElement;

    await act(async () => {
      setInputValue(formInputs[1] as HTMLInputElement, "140");
      setInputValue(formInputs[2] as HTMLInputElement, "15");
      setInputValue(textarea, "Ajuste operacional");
      saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedUpsert).toHaveBeenCalledWith(17, expect.any(String), {
      totalProduced: 140,
      withdrawalProduced: 15,
      notes: "Ajuste operacional",
    });
  });
});
