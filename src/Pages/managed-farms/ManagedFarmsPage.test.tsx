// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ManagedFarmsPage from "./ManagedFarmsPage";

const managedFarmsMock = vi.hoisted(() => vi.fn());
vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({ getManagedFarmsPaginated: managedFarmsMock }));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("ManagedFarmsPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    managedFarmsMock.mockReset();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("renders managed choices and canonical dashboard CTA", async () => {
    managedFarmsMock.mockResolvedValue({
      content: [{ id: 14, name: "Capril Vilar", tod: "16432", logoUrl: null }],
      page: { size: 12, number: 0, totalPages: 1, totalElements: 1 },
    });
    await act(async () => {
      root.render(<MemoryRouter initialEntries={["/app/goatfarms"]}><Routes><Route path="/app/goatfarms" element={<ManagedFarmsPage />} /><Route path="*" element={<LocationProbe />} /></Routes></MemoryRouter>);
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Capril Vilar");
    expect(container.textContent).toContain("TOD 16432");
    const button = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Acessar gestão"));
    await act(async () => button?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(container.querySelector("[data-testid=location]")?.textContent).toBe("/app/goatfarms/14/dashboard");
  });

  it("shows an actionable empty state", async () => {
    managedFarmsMock.mockResolvedValue({ content: [], page: { size: 12, number: 0, totalPages: 0, totalElements: 0 } });
    await act(async () => {
      root.render(<MemoryRouter initialEntries={["/app/goatfarms"]}><Routes><Route path="/app/goatfarms" element={<ManagedFarmsPage />} /><Route path="*" element={<LocationProbe />} /></Routes></MemoryRouter>);
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Nenhuma fazenda disponível para gestão");
    expect(container.textContent).toContain("Ver fazendas públicas");
  });

  it("renders retryable loading failure", async () => {
    managedFarmsMock.mockRejectedValue(new Error("offline"));
    await act(async () => {
      root.render(<MemoryRouter initialEntries={["/app/goatfarms"]}><ManagedFarmsPage /></MemoryRouter>);
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Não foi possível carregar suas fazendas");
    expect(container.textContent).toContain("Tentar novamente");
  });

  it("retries the requested page after a pagination failure", async () => {
    managedFarmsMock
      .mockResolvedValueOnce({
        content: [{ id: 14, name: "Capril Vilar", tod: "16432", logoUrl: null }],
        page: { size: 1, number: 0, totalPages: 2, totalElements: 2 },
      })
      .mockRejectedValueOnce(new Error("page offline"))
      .mockResolvedValueOnce({
        content: [{ id: 19, name: "Capril Bocaina", tod: "14008", logoUrl: null }],
        page: { size: 1, number: 1, totalPages: 2, totalElements: 2 },
      });

    await act(async () => {
      root.render(<MemoryRouter initialEntries={["/app/goatfarms"]}><ManagedFarmsPage /></MemoryRouter>);
      await Promise.resolve();
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Próxima"));
    await act(async () => {
      nextButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Não foi possível carregar suas fazendas");
    const retryButton = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Tentar novamente"));
    await act(async () => {
      retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(managedFarmsMock).toHaveBeenNthCalledWith(1, 0, 12, "");
    expect(managedFarmsMock).toHaveBeenNthCalledWith(2, 1, 12, "");
    expect(managedFarmsMock).toHaveBeenNthCalledWith(3, 1, 12, "");
    expect(container.textContent).toContain("Capril Bocaina");
  });

  it("searches the backend, resets page, and paginates the searched result", async () => {
    managedFarmsMock
      .mockResolvedValueOnce({
        content: [{ id: 14, name: "Capril Vilar", tod: "16432", logoUrl: null }],
        page: { size: 1, number: 0, totalPages: 2, totalElements: 2 },
      })
      .mockResolvedValueOnce({
        content: [{ id: 19, name: "Capril Bocaina", tod: "14008", logoUrl: null }],
        page: { size: 1, number: 0, totalPages: 2, totalElements: 2 },
      })
      .mockResolvedValueOnce({
        content: [{ id: 20, name: "Capril Alto Paraíso", tod: "16153", logoUrl: null }],
        page: { size: 1, number: 1, totalPages: 2, totalElements: 2 },
      })
      .mockResolvedValueOnce({
        content: [{ id: 19, name: "Capril Bocaina", tod: "14008", logoUrl: null }],
        page: { size: 1, number: 0, totalPages: 2, totalElements: 2 },
      })
      .mockResolvedValueOnce({
        content: [{ id: 14, name: "Capril Vilar", tod: "16432", logoUrl: null }],
        page: { size: 12, number: 0, totalPages: 1, totalElements: 1 },
      });

    await act(async () => {
      root.render(<MemoryRouter initialEntries={["/app/goatfarms"]}><ManagedFarmsPage /></MemoryRouter>);
      await Promise.resolve();
    });

    const input = container.querySelector("#managed-farms-search") as HTMLInputElement;
    await act(async () => {
      setInputValue(input, "bocaina");
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Capril Bocaina");
    expect(managedFarmsMock).toHaveBeenNthCalledWith(2, 0, 12, "bocaina");

    const nextButton = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Próxima"));
    await act(async () => {
      nextButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(managedFarmsMock).toHaveBeenNthCalledWith(3, 1, 12, "bocaina");

    const previousButton = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Anterior"));
    await act(async () => {
      previousButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(managedFarmsMock).toHaveBeenNthCalledWith(4, 0, 12, "bocaina");

    await act(async () => {
      setInputValue(container.querySelector("#managed-farms-search") as HTMLInputElement, "");
      await Promise.resolve();
    });
    expect(managedFarmsMock).toHaveBeenNthCalledWith(5, 0, 12, "");
    expect(container.textContent).toContain("Capril Vilar");
  });

  it("shows an empty state for a searched result", async () => {
    managedFarmsMock
      .mockResolvedValueOnce({
        content: [{ id: 14, name: "Capril Vilar", tod: "16432", logoUrl: null }],
        page: { size: 12, number: 0, totalPages: 1, totalElements: 1 },
      })
      .mockResolvedValueOnce({ content: [], page: { size: 12, number: 0, totalPages: 0, totalElements: 0 } });

    await act(async () => {
      root.render(<MemoryRouter initialEntries={["/app/goatfarms"]}><ManagedFarmsPage /></MemoryRouter>);
      await Promise.resolve();
    });
    await act(async () => {
      setInputValue(container.querySelector("#managed-farms-search") as HTMLInputElement, "inexistente");
      await Promise.resolve();
    });

    expect(managedFarmsMock).toHaveBeenNthCalledWith(2, 0, 12, "inexistente");
    expect(container.textContent).toContain("Nenhuma fazenda disponível para gestão");
  });

  it("retries a failed searched page with the current query", async () => {
    managedFarmsMock
      .mockResolvedValueOnce({
        content: [{ id: 14, name: "Capril Vilar", tod: "16432", logoUrl: null }],
        page: { size: 12, number: 0, totalPages: 1, totalElements: 1 },
      })
      .mockRejectedValueOnce(new Error("search offline"))
      .mockResolvedValueOnce({
        content: [{ id: 19, name: "Capril Bocaina", tod: "14008", logoUrl: null }],
        page: { size: 12, number: 0, totalPages: 1, totalElements: 1 },
      });

    await act(async () => {
      root.render(<MemoryRouter initialEntries={["/app/goatfarms"]}><ManagedFarmsPage /></MemoryRouter>);
      await Promise.resolve();
    });
    await act(async () => {
      setInputValue(container.querySelector("#managed-farms-search") as HTMLInputElement, "bocaina");
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Não foi possível carregar suas fazendas");

    const retryButton = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes("Tentar novamente"));
    await act(async () => {
      retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(managedFarmsMock).toHaveBeenNthCalledWith(3, 0, 12, "bocaina");
    expect(container.textContent).toContain("Capril Bocaina");
  });
});
