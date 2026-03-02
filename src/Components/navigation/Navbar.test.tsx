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
  });
});
