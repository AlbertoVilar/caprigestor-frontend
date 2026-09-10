// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FarmEditPage from "./FarmEditPage";
import { getGoatFarmForManagement } from "../../api/GoatFarmAPI/goatFarm";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";

const apiMocks = vi.hoisted(() => ({
  getGoatFarmForManagement: vi.fn(),
  updateGoatFarmFull: vi.fn(),
  deleteGoatFarmPhone: vi.fn(),
}));

vi.mock("../../api/GoatFarmAPI/goatFarm", () => apiMocks);
vi.mock("../../Hooks/useFarmPermissions", () => ({ useFarmPermissions: vi.fn() }));

const getManagementMock = vi.mocked(getGoatFarmForManagement);
const permissionsMock = vi.mocked(useFarmPermissions);

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

function renderPage(entry = "/fazendas/19/editar") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <LocationProbe />
        <Routes>
          <Route path="fazendas/:id/editar" element={<FarmEditPage />} />
        </Routes>
      </MemoryRouter>,
    );
  });

  return { container, root };
}

async function flushEffects() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("FarmEditPage", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    permissionsMock.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: true,
      loading: false,
    } as ReturnType<typeof useFarmPermissions>);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
    }
    container?.remove();
    root = undefined;
    container = undefined;
  });

  it("loads the authenticated management contract and pre-fills every returned field", async () => {
    getManagementMock.mockResolvedValueOnce({
      id: 19,
      name: "Capril Vilar",
      tod: "14008",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
      version: 3,
      userId: 22,
      userName: "Carlos Vidal",
      userEmail: "carlos@example.invalid",
      userCpf: "12345678900",
      addressId: 20,
      street: "Rua das Cabras",
      district: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      cep: "20000000",
      country: "Brasil",
      phones: [{ id: 21, ddd: "21", number: "999999999" }],
    });

    ({ container, root } = renderPage());
    await flushEffects();

    expect(getManagementMock).toHaveBeenCalledWith(19);
    expect(container.querySelector<HTMLInputElement>("#owner-name")?.value).toBe("Carlos Vidal");
    expect(container.querySelector<HTMLInputElement>("#owner-email")?.value).toBe("carlos@example.invalid");
    expect(container.querySelector<HTMLInputElement>("#owner-cpf")?.value).toBe("123.456.789-00");
    expect(container.querySelector<HTMLInputElement>("#address-street")?.value).toBe("Rua das Cabras");
    expect(container.querySelector<HTMLInputElement>("#address-neighborhood")?.value).toBe("Centro");
    expect(container.querySelector<HTMLInputElement>("#address-city")?.value).toBe("Rio de Janeiro");
    expect(container.querySelector<HTMLInputElement>("#address-state")?.value).toBe("RJ");
    expect(container.querySelector<HTMLInputElement>("#address-cep")?.value).toBe("20000-000");
    expect(container.querySelector<HTMLInputElement>("#address-country")?.value).toBe("Brasil");
    expect(container.querySelector<HTMLInputElement>("#farm-name")?.value).toBe("Capril Vilar");
    expect(container.querySelector<HTMLInputElement>("#farm-tod")?.value).toBe("14008");
    expect(container.querySelector<HTMLInputElement>("#phone-ddd-0")?.value).toBe("21");
    expect(container.querySelector<HTMLInputElement>("#phone-number-0")?.value).toBe("999999999");
  });

  it("does not request administrative data or render the form without farm capability", async () => {
    permissionsMock.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: false,
      loading: false,
    } as ReturnType<typeof useFarmPermissions>);

    ({ container, root } = renderPage());
    await flushEffects();

    expect(getManagementMock).not.toHaveBeenCalled();
    expect(container.querySelector("input")).toBeNull();
    expect(container.querySelector("[data-testid=location]")?.textContent).toBe("/403");
  });

  it("keeps genuinely missing management values empty", async () => {
    getManagementMock.mockResolvedValueOnce({
      id: 19,
      name: null,
      tod: null,
      userId: 22,
      userName: null,
      userEmail: null,
      userCpf: null,
      addressId: 20,
      street: null,
      district: null,
      city: null,
      state: null,
      cep: null,
      country: null,
      phones: [{ id: null, ddd: null, number: null }],
    } as never);

    ({ container, root } = renderPage());
    await flushEffects();

    expect(container.querySelector<HTMLInputElement>("#owner-name")?.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#owner-email")?.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#owner-cpf")?.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#address-street")?.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#address-country")?.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#farm-name")?.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#phone-ddd-0")?.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#phone-number-0")?.value).toBe("");
  });

  it("shows the permission loading state without requesting farm data", async () => {
    permissionsMock.mockReturnValue({
      canOperateFarm: false,
      canAdministerFarm: false,
      loading: true,
    } as ReturnType<typeof useFarmPermissions>);

    ({ container, root } = renderPage());
    await flushEffects();

    expect(getManagementMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Verificando permissões...");
  });

  it("navigates to forbidden when the management read is rejected with 403", async () => {
    getManagementMock.mockRejectedValueOnce({ response: { status: 403 } });

    ({ container, root } = renderPage());
    await flushEffects();

    expect(container.querySelector("[data-testid=location]")?.textContent).toBe("/403");
  });

  it("redirects to the farm list after a successful update", async () => {
    getManagementMock.mockResolvedValueOnce({
      id: 19,
      name: "Capril Vilar",
      tod: "14008",
      version: 3,
      userId: 22,
      userName: "Carlos Vidal",
      userEmail: "carlos@example.invalid",
      userCpf: "12345678900",
      addressId: 20,
      street: "Rua das Cabras",
      district: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      cep: "20000000",
      country: "Brasil",
      phones: [{ id: 21, ddd: "21", number: "999999999" }],
    });
    apiMocks.updateGoatFarmFull.mockResolvedValueOnce(undefined);

    ({ container, root } = renderPage());
    await flushEffects();

    const saveButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Salvar"));
    expect(saveButton).toBeDefined();
    await act(async () => {
      saveButton?.click();
    });
    await flushEffects();

    expect(apiMocks.updateGoatFarmFull).toHaveBeenCalled();
    expect(container.querySelector("[data-testid=location]")?.textContent).toBe("/fazendas");
  });
});
