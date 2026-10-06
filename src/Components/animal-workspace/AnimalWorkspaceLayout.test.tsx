// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnimalWorkspaceLayout from "./AnimalWorkspaceLayout";

const fetchGoatMock = vi.hoisted(() => vi.fn());
vi.mock("../../api/GoatAPI/goat", () => ({ fetchGoatById: fetchGoatMock }));
vi.mock("../../Components/ui", () => ({
  LoadingState: ({ label }: { label: string }) => <div>{label}</div>,
  ErrorState: ({ title, description, onRetry, retryLabel }: { title: string; description: string; onRetry?: () => void; retryLabel?: string }) => (
    <div>
      <strong>{title}</strong>
      <span>{description}</span>
      {onRetry && <button type="button" onClick={onRetry}>{retryLabel ?? "Retry"}</button>}
    </div>
  ),
}));

describe("AnimalWorkspaceLayout", () => {
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); fetchGoatMock.mockReset(); });
  afterEach(() => { act(() => root.unmount()); host.remove(); });

  const renderRoute = (entry: string) => act(() => {
    root.render(<MemoryRouter key={entry} initialEntries={[entry]}><Routes><Route path="/app/goatfarms/:farmId/goats/:goatId/*" element={<AnimalWorkspaceLayout />}><Route index element={<div>overview</div>} /><Route path="health" element={<div>health</div>} /></Route></Routes></MemoryRouter>);
  });
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("loads animal identity and exposes canonical private modules", async () => {
    fetchGoatMock.mockResolvedValue({ technicalId: 42, registrationNumber: "1400820006", name: "Corista da Bocaina", gender: "F", status: "ATIVO", farmId: 7 });
    await renderRoute("/app/goatfarms/7/goats/technical-42");
    await act(async () => { await flush(); });
    expect(host.textContent).toContain("Corista da Bocaina");
    expect(host.textContent).toContain("Genealogia");
    expect(host.textContent).toContain("Lactações");
    expect(host.textContent).toContain("Voltar ao rebanho");
  });

  it("keeps a male animal out of female-only modules", async () => {
    fetchGoatMock.mockResolvedValue({ technicalId: 43, registrationNumber: "1400820007", name: "Macho QA", gender: "M", status: "ATIVO", farmId: 7 });
    await renderRoute("/app/goatfarms/7/goats/technical-43");
    await act(async () => { await flush(); });
    expect(host.textContent).toContain("Macho QA");
    expect(host.textContent).not.toContain("Lactações");
    expect(host.textContent).not.toContain("Leite");
    expect(host.textContent).not.toContain("Reprodução");
  });

  it("keeps module navigation hidden while the identity is loading", async () => {
    fetchGoatMock.mockReturnValue(new Promise(() => undefined));
    await renderRoute("/app/goatfarms/7/goats/legacy-rg");
    expect(host.textContent).toContain("Carregando o espaço de trabalho do animal...");
    expect(host.querySelector('[aria-label="Módulos do animal"]')).toBeNull();
  });

  it("shows a retryable identity error and refetches successfully", async () => {
    fetchGoatMock
      .mockRejectedValueOnce(new Error("Animal não encontrado"))
      .mockResolvedValueOnce({ technicalId: 42, registrationNumber: "RG-42", name: "Recuperada", gender: "F", status: "ATIVO", farmId: 7 });
    await renderRoute("/app/goatfarms/7/goats/technical-42");
    await act(async () => { await flush(); });
    expect(host.textContent).toContain("Não foi possível carregar o animal");
    const retry = Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Tentar novamente");
    expect(retry).toBeTruthy();
    await act(async () => { retry?.click(); await flush(); });
    expect(host.textContent).toContain("Recuperada");
    expect(fetchGoatMock).toHaveBeenCalledTimes(2);
  });

  it("does not let a stale response overwrite a newer farm/goat context", async () => {
    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;
    fetchGoatMock
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }));
    await renderRoute("/app/goatfarms/7/goats/legacy-first");
    await act(async () => { await flush(); });
    await renderRoute("/app/goatfarms/8/goats/legacy-second");
    await act(async () => { await flush(); });
    await act(async () => { resolveSecond({ technicalId: 8, registrationNumber: "RG-8", name: "Segundo", gender: "F", status: "ATIVO", farmId: 8 }); await flush(); });
    expect(host.textContent).toContain("Segundo");
    await act(async () => { resolveFirst({ technicalId: 7, registrationNumber: "RG-7", name: "Primeiro", gender: "F", status: "ATIVO", farmId: 7 }); await flush(); });
    expect(host.textContent).toContain("Segundo");
    expect(host.textContent).not.toContain("Primeiro");
  });

  it("converges legacy entry navigation to the technical token and marks the active module", async () => {
    fetchGoatMock.mockResolvedValue({ technicalId: 42, registrationNumber: "1400820006", name: "Tokenizada", gender: "F", status: "ATIVO", farmId: 7 });
    await renderRoute("/app/goatfarms/7/goats/1400820006/health");
    await act(async () => { await flush(); });
    expect(host.querySelector('a[href="/app/goatfarms/7/goats/technical-42/health"]')?.className).toContain("is-active");
    expect(host.querySelector('a[href="/app/goatfarms/7/goats/technical-42/events"]')).toBeTruthy();
    expect(host.querySelector('a[href="/app/goatfarms/7/goats/technical-42/genealogy"]')).toBeTruthy();
  });
});
