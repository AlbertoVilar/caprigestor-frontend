// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LactationManager from "./LactationManager";
import { getLactationHistory, startLactation } from "../../api/GoatFarmAPI/lactation";

vi.mock("../../api/GoatFarmAPI/lactation", () => ({
  getLactationHistory: vi.fn(),
  startLactation: vi.fn(),
  dryLactation: vi.fn(),
  resumeLactation: vi.fn(),
}));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const historyMock = vi.mocked(getLactationHistory);
const startMock = vi.mocked(startLactation);
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("LactationManager age confirmation", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    historyMock.mockReset();
    startMock.mockReset();
    historyMock.mockResolvedValue({ content: [] } as never);
    startMock.mockResolvedValue({ id: 1 } as never);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  async function render(birthDate: string) {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <LactationManager farmId={2} goatId="RG-42" goatName="Cabrita" goatBirthDate={birthDate} canManage />
        </MemoryRouter>,
      );
    });
  }

  async function clickButton(label: string) {
    const button = Array.from(document.querySelectorAll("button"))
      .find((candidate) => candidate.textContent?.includes(label));
    expect(button).toBeTruthy();
    await act(async () => button?.click());
  }

  async function setStartDate(date: string) {
    const input = document.querySelector<HTMLInputElement>("#lactation-start-date");
    expect(input).toBeTruthy();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    await act(async () => {
      setter?.call(input, date);
      input?.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("blocks pre-birth dates before calling the API", async () => {
    await render("2026-09-28");
    await clickButton("Iniciar lactação");
    await setStartDate("2026-09-27");
    await clickButton("Salvar");
    expect(startMock).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("não pode ser anterior");
  });

  it("requires an explicit checkbox for a young goat and sends the flag", async () => {
    await render("2026-09-28");
    await clickButton("Iniciar lactação");
    await setStartDate("2026-09-28");
    expect(document.body.textContent).toContain("menos de 12 meses");
    await clickButton("Salvar");
    expect(startMock).not.toHaveBeenCalled();
    const checkbox = document.querySelector<HTMLInputElement>(".lactation-manager__age-confirmation input");
    expect(checkbox?.checked).toBe(false);
    await act(async () => checkbox?.click());
    await clickButton("Salvar");
    expect(startMock).toHaveBeenCalledWith(2, "RG-42", {
      startDate: "2026-09-28", confirmYoungAge: true,
    });
  });

  it("does not send confirmation for an adult and clears it when the date changes", async () => {
    await render("2025-09-28");
    await clickButton("Iniciar lactação");
    await setStartDate("2026-09-27");
    const checkbox = document.querySelector<HTMLInputElement>(".lactation-manager__age-confirmation input");
    await act(async () => checkbox?.click());
    await setStartDate("2026-09-28");
    expect(document.querySelector(".lactation-manager__age-confirmation")).toBeNull();
    await clickButton("Salvar");
    expect(startMock).toHaveBeenCalledWith(2, "RG-42", { startDate: "2026-09-28" });
  });

  it("clears young-age confirmation on date changes and modal reopening", async () => {
    await render("2026-09-20");
    await clickButton("Iniciar lactação");
    await setStartDate("2026-09-20");
    let checkbox = document.querySelector<HTMLInputElement>(".lactation-manager__age-confirmation input");
    await act(async () => checkbox?.click());
    expect(checkbox?.checked).toBe(true);

    await setStartDate("2026-09-21");
    checkbox = document.querySelector<HTMLInputElement>(".lactation-manager__age-confirmation input");
    expect(checkbox?.checked).toBe(false);

    await act(async () => checkbox?.click());
    await clickButton("Cancelar");
    await clickButton("Iniciar lactação");
    await setStartDate("2026-09-21");
    checkbox = document.querySelector<HTMLInputElement>(".lactation-manager__age-confirmation input");
    expect(checkbox?.checked).toBe(false);
  });

  it("does not direct a young-age 422 error to reproduction", async () => {
    startMock.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { errors: [{ fieldName: "confirmYoungAge", message: "Confirme a idade." }] },
      },
    });
    await render("2026-09-28");
    await clickButton("Iniciar lactação");
    await setStartDate("2026-09-28");
    const checkbox = document.querySelector<HTMLInputElement>(".lactation-manager__age-confirmation input");
    await act(async () => checkbox?.click());
    await clickButton("Salvar");
    expect(document.body.textContent).toContain("Confirme a idade.");
    expect(document.body.textContent).not.toContain("Ver reprodução");
  });
});
