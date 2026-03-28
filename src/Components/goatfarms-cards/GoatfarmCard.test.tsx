import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import GoatfarmCard from "./GoatfarmCard";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock("../../Hooks/usePermissions", () => ({
  usePermissions: () => ({
    canEditFarm: () => true,
    canDeleteFarm: () => true,
  }),
}));

describe("GoatfarmCard", () => {
  const farm = {
    id: 1,
    name: "Capril Vilar",
    tod: "123",
    userName: "Alberto",
    city: "Belo Horizonte",
    state: "MG",
    phones: [],
    logoUrl: "",
  } as unknown as GoatFarmDTO;

  it("closes the primary link before rendering secondary actions", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GoatfarmCard farm={farm} />
      </MemoryRouter>
    );

    expect(html).toContain("</a><div class=\"farm-card-actions\">");
  });

  it("uses the farm dashboard as the primary destination and exposes herd as a secondary action", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GoatfarmCard farm={farm} />
      </MemoryRouter>
    );

    expect(html).toContain('aria-label="Abrir dashboard da fazenda Capril Vilar"');
    expect(html).toContain('href="/app/goatfarms/1/dashboard"');
    expect(html).toContain('aria-label="Abrir rebanho da fazenda Capril Vilar"');
    expect(html).toContain('href="/cabras?farmId=1"');
    expect(html).toContain('aria-label="Abrir comercial da fazenda Capril Vilar"');
    expect(html).toContain('href="/app/goatfarms/1/commercial"');
    expect(html).toContain(">Comercial</span>");
  });
});
