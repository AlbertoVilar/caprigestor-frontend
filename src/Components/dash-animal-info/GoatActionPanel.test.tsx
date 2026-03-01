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
    canDeleteEvent: () => false,
  },
}));

describe("GoatActionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps only animal actions in the panel and removes inventory from this context", () => {
    const html = renderToStaticMarkup(
      <GoatActionPanel
        registrationNumber="1615325001"
        goatId={99}
        farmId={12}
        canAccessModules={true}
        gender="FEMALE"
        resourceOwnerId={7}
        onShowGenealogy={() => {}}
        onShowEventForm={() => {}}
      />
    );

    expect(html).toContain("Ações do Animal");
    expect(html).toContain("Gerenciar Fazenda");
    expect(html).toContain("Sanidade");
    expect(html).toContain("Lactações");
    expect(html).toContain("Produção de leite");
    expect(html).toContain("Reprodução");
    expect(html).not.toContain("Estoque");
  });
});
