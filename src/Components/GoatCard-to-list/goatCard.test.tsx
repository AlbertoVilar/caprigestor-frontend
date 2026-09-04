import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import GoatCard from "./goatCard";

const accessState = vi.hoisted(() => ({
  isAuthenticated: false,
  canManage: false,
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: accessState.isAuthenticated,
  }),
}));

vi.mock("../../Hooks/usePermissions", () => ({
  usePermissions: () => ({
    isOwner: () => accessState.canManage,
    canEditGoat: () => accessState.canManage,
    canDeleteGoat: () => accessState.canManage,
  }),
}));

describe("GoatCard detail navigation", () => {
  const goat: GoatResponseDTO = {
    id: 99,
    registrationNumber: "1643217101",
    name: "Chocolate V",
    breed: "ALPINA",
    color: "CHAMOISÉE",
    gender: "FEMALE",
    birthDate: "2017-06-01",
    status: "ACTIVE",
    category: "PO",
    toe: "17101",
    tod: "16432",
    farmId: 1,
    ownerId: 7,
  };

  beforeEach(() => {
    accessState.isAuthenticated = false;
    accessState.canManage = false;
  });

  it("keeps visitors and unauthorized users on the public animal profile", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GoatCard goat={goat} farmOwnerId={7} onEdit={() => {}} />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/fazendas/1/animais/99"');
    expect(html).toContain('aria-label="Ver perfil público do animal Chocolate V"');
    expect(html).not.toContain('href="/app/goatfarms/1/goats/99"');
  });

  it("opens the private management page for an authenticated manager", () => {
    accessState.isAuthenticated = true;
    accessState.canManage = true;

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GoatCard goat={goat} farmOwnerId={7} onEdit={() => {}} />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/app/goatfarms/1/goats/99"');
    expect(html).toContain('aria-label="Gerenciar o animal Chocolate V"');
    expect(html).not.toContain('href="/fazendas/1/animais/99"');
  });
});
