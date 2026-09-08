import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    tokenPayload: {
      user_name: "Alberto",
      userEmail: "alberto@example.com",
      authorities: ["ROLE_ADMIN"],
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../../Hooks/usePermissions", () => ({
  usePermissions: () => ({
    isAdmin: () => true,
  }),
}));

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

describe("Navbar", () => {
  it("renders the mobile drawer entry points with accessible labels", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(html).toContain('aria-label="Abrir menu de navegação"');
    expect(html).toContain('id="mobile-nav-drawer"');
    expect(html).toContain('aria-label="Ir para Fazendas"');
    expect(html).toContain(">Fazendas<");
    expect(html).toContain('aria-label="Saiba mais sobre o CapriGestor"');
    expect(html).toContain('aria-label="Alertas da fazenda: 1 pendente(s), alta prioridade"');
    expect(html).toContain("alert-center-bell--high");
  });
});
