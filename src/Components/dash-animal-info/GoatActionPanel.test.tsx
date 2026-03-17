import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GoatActionPanel from "./GoatActionPanel";

const navigateSpy = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateSpy,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    tokenPayload: {
      userId: 7,
      authorities: ["ROLE_FARM_OWNER"],
    },
  }),
}));

vi.mock("@/services/PermissionService", () => ({
  PermissionService: {
    canViewEvent: () => true,
    canCreateEvent: () => true,
    canEditEvent: () => true,
    canDeleteEvent: () => true,
  },
}));

describe("GoatActionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps only animal actions in the panel and removes farm inventory and dead delete actions", () => {
    const html = renderToStaticMarkup(
      <GoatActionPanel
        registrationNumber="1615325001"
        goatId={99}
        farmId={12}
        canAccessModules={true}
        gender="FEMALE"
        resourceOwnerId={7}
        onShowEventForm={() => {}}
      />
    );

    expect(html).toContain("Gerenciar Fazenda");
    expect(html).toContain("Abrir genealogia completa");
    expect(html).toContain("Sanidade");
    expect(html).toContain("Reprodução");
    expect(html).not.toContain("Estoque");
    expect(html).not.toContain("Excluir");
  });

  it("renders controlled exit action and disables it for non-active goats", () => {
    const html = renderToStaticMarkup(
      <GoatActionPanel
        registrationNumber="1615325001"
        goatId={99}
        farmId={12}
        canAccessModules={true}
        gender="FEMALE"
        status="VENDIDO"
        resourceOwnerId={7}
        onShowEventForm={() => {}}
        onRequestExit={() => {}}
      />
    );

    expect(html).toContain("Registrar saída do rebanho");
    expect(html).toContain("operações operacionais ficam bloqueadas");
    expect(html).toContain("disabled");
  });
});

