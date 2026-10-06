import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

const authMock = vi.hoisted(() => vi.fn());
const permissionsMock = vi.hoisted(() => vi.fn());

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: authMock,
}));

vi.mock("../../Hooks/usePermissions", () => ({
  usePermissions: permissionsMock,
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
  beforeEach(() => {
    authMock.mockReturnValue({
      tokenPayload: {
        user_name: "Alberto",
        userEmail: "alberto@example.com",
        authorities: ["ROLE_ADMIN"],
      },
      logout: vi.fn(),
    });
    permissionsMock.mockReturnValue({
      isAdmin: () => true,
      isFarmOwner: () => false,
      isOperator: () => false,
    });
  });

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
    expect(html).toContain('aria-label="Ir para Animais"');
    expect(html).toContain(">Animais<");
    expect(html).toContain('aria-label="Saiba mais sobre o CapriGestor"');
    expect(html).toContain('aria-label="Alertas da fazenda: 1 pendente(s), alta prioridade"');
    expect(html).toContain("alert-center-bell--high");
  });

  it("keeps private management separate from the public farm catalog", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(html).toContain('href="/app/goatfarms"');
    expect(html).toContain(">Gestão<");
    expect(html).toContain('href="/fazendas"');
    expect(html).toContain(">Fazendas<");
  });

  it("does not expose the authenticated management entry to visitors", () => {
    authMock.mockReturnValue({ tokenPayload: null, logout: vi.fn() });
    permissionsMock.mockReturnValue({
      isAdmin: () => false,
      isFarmOwner: () => false,
      isOperator: () => false,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(html).not.toContain(">Gestão<");
    expect(html).toContain('href="/fazendas"');
  });

  it.each([
    ["FARM_OWNER", { isAdmin: false, isFarmOwner: true, isOperator: false }],
    ["OPERATOR", { isAdmin: false, isFarmOwner: false, isOperator: true }],
  ])("exposes Gestão to authenticated %s users", (_role, rolePermissions) => {
    permissionsMock.mockReturnValue({
      isAdmin: () => rolePermissions.isAdmin,
      isFarmOwner: () => rolePermissions.isFarmOwner,
      isOperator: () => rolePermissions.isOperator,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(html).toContain('href="/app/goatfarms"');
    expect(html).toContain(">Gestão<");
  });

  it("hides Gestão from an authenticated ROLE_USER", () => {
    permissionsMock.mockReturnValue({
      isAdmin: () => false,
      isFarmOwner: () => false,
      isOperator: () => false,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(html).not.toContain(">Gestão<");
    expect(html).toContain('href="/fazendas"');
  });
});
