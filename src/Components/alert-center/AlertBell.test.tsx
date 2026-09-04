import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AlertBell from "./AlertBell";

vi.mock("../../contexts/alerts/FarmAlertsContext", () => ({
  useFarmAlerts: () => ({
    farmId: 14,
    totalCount: 1,
    highestSeverity: "high",
    providerStates: [],
    isLoading: false,
    refreshAlerts: vi.fn(),
    getProvider: vi.fn(),
  }),
}));

describe("AlertBell", () => {
  it("announces and highlights a high-severity farm alert", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AlertBell farmId={14} className="navbar-alert-btn" />
      </MemoryRouter>
    );

    expect(html).toContain("navbar-alert-btn alert-center-bell--high");
    expect(html).toContain('data-severity="high"');
    expect(html).toContain('aria-label="Alertas da fazenda: 1 pendente(s), alta prioridade"');
    expect(html).toContain('<span class="alert-badge">1</span>');
  });
});
