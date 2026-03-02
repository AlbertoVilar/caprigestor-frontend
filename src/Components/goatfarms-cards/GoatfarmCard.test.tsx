import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import GoatfarmCard from "./GoatfarmCard";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock("@/Hooks/usePermissions", () => ({
  usePermissions: () => ({
    canEditFarm: () => true,
    canDeleteFarm: () => true,
  }),
}));

describe("GoatfarmCard", () => {
  it("closes the primary link before rendering secondary actions", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GoatfarmCard
          farm={{
            id: 1,
            name: "Capril Vilar",
            tod: "123",
            userName: "Alberto",
            city: "Belo Horizonte",
            state: "MG",
            phones: [],
            logoUrl: "",
          } as unknown as GoatFarmDTO}
        />
      </MemoryRouter>
    );

    expect(html).toContain("</a><div class=\"farm-card-actions\">");
  });
});
