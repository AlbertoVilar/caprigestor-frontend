// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FarmWorkspaceLayout from "./FarmWorkspaceLayout";

const getFarmMock = vi.hoisted(() => vi.fn());
const permissionsMock = vi.hoisted(() => vi.fn());
const retryPermissionsMock = vi.hoisted(() => vi.fn());

vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({ getGoatFarmById: getFarmMock }));
vi.mock("../../Hooks/useFarmPermissions", () => ({ useFarmPermissions: permissionsMock }));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function RouteSwitcher() {
  const navigate = useNavigate();
  return (
    <button type="button" data-testid="switch-route" onClick={() => navigate("/app/goatfarms/19/dashboard")}>
      Mudar fazenda
    </button>
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const farm = {
  id: 14,
  name: "Capril Alto Paraíso",
  tod: "16153",
  logoUrl: undefined,
};

describe("FarmWorkspaceLayout", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    getFarmMock.mockResolvedValue(farm);
    permissionsMock.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: true,
      loading: false,
      error: null,
      retry: retryPermissionsMock,
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    getFarmMock.mockReset();
    permissionsMock.mockReset();
    retryPermissionsMock.mockReset();
  });

  it("keeps farm identity visible while rendering first-level modules", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/dashboard"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId" element={<FarmWorkspaceLayout />}>
              <Route path="dashboard" element={<div data-testid="module">dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Capril Alto Paraíso");
    expect(container.textContent).toContain("TOD 16153");
    expect(container.textContent).toContain("Comercial");
    expect(container.textContent).toContain("Transferências");
    expect(container.querySelector('[data-testid="module"]')?.textContent).toBe("dashboard");
    expect(container.querySelector('a[href="/app/goatfarms/14/commercial"]')).not.toBeNull();
  });

  it("keeps transfer navigation permission-controlled", async () => {
    permissionsMock.mockReturnValue({
      canOperateFarm: true,
      canAdministerFarm: false,
      loading: false,
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/dashboard"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId" element={<FarmWorkspaceLayout />}>
              <Route path="dashboard" element={<div>dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).not.toContain("Transferências");
  });

  it("sends farm switching to the private managed-farm selector", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/dashboard"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId" element={<FarmWorkspaceLayout />}>
              <Route path="dashboard" element={<div>dashboard</div>} />
            </Route>
            <Route path="/app/goatfarms" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    await act(async () => {
      container.querySelector(".farm-workspace__switch")?.dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe(
      "/app/goatfarms"
    );
  });

  it("keeps permission failures recoverable instead of redirecting to 403", async () => {
    permissionsMock.mockReturnValue({
      canOperateFarm: false,
      canAdministerFarm: false,
      loading: false,
      error: new Error("network"),
      retry: retryPermissionsMock,
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/dashboard"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId" element={<FarmWorkspaceLayout />}>
              <Route path="dashboard" element={<div>dashboard</div>} />
            </Route>
            <Route path="/app/goatfarms" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Não foi possível consultar as permissões");
    expect(container.textContent).not.toContain("dashboard");
    expect(container.querySelector('a[href="/app/goatfarms/14/commercial"]')).toBeNull();

    const retryButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Tentar novamente")
    );
    retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(retryPermissionsMock).toHaveBeenCalledOnce();

    const exitButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Escolher fazenda")
    );
    await act(async () => {
      exitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe(
      "/app/goatfarms"
    );
  });

  it("does not render module navigation while permissions are loading", async () => {
    permissionsMock.mockReturnValue({
      canOperateFarm: false,
      canAdministerFarm: false,
      loading: true,
      error: null,
      retry: retryPermissionsMock,
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/dashboard"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId/*" element={<FarmWorkspaceLayout />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Carregando o espaço de trabalho");
    expect(container.querySelector('nav[aria-label="Módulos da fazenda"]')).toBeNull();
  });

  it("redirects successful false capabilities to 403", async () => {
    permissionsMock.mockReturnValue({
      canOperateFarm: false,
      canAdministerFarm: false,
      loading: false,
      error: null,
      retry: retryPermissionsMock,
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/dashboard"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId/*" element={<FarmWorkspaceLayout />} />
            <Route path="/403" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe("/403");
  });

  it("shows invalid farm context with a safe private selector exit", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/not-a-farm/dashboard"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId/*" element={<FarmWorkspaceLayout />} />
            <Route path="/app/goatfarms" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Fazenda inválida");
    const exitButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Escolher fazenda")
    );
    await act(async () => {
      exitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe(
      "/app/goatfarms"
    );
  });

  it("marks the current first-level module as active", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/commercial"]}>
          <Routes>
            <Route path="/app/goatfarms/:farmId" element={<FarmWorkspaceLayout />}>
              <Route path="commercial" element={<div>commercial</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.querySelector('a[href="/app/goatfarms/14/commercial"]')?.getAttribute("aria-current"))
      .toBe("page");
  });

  it("ignores a stale farm response after the route changes", async () => {
    const oldRequest = deferred<typeof farm>();
    const currentRequest = deferred<typeof farm>();
    getFarmMock.mockImplementation((requestedFarmId: number) =>
      requestedFarmId === 14 ? oldRequest.promise : currentRequest.promise
    );

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/14/dashboard"]}>
          <Routes>
            <Route
              path="/app/goatfarms/:farmId"
              element={
                <>
                  <RouteSwitcher />
                  <FarmWorkspaceLayout />
                </>
              }
            >
              <Route path="dashboard" element={<div>dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    await act(async () => {
      container.querySelector('[data-testid="switch-route"]')?.dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
      await Promise.resolve();
    });

    await act(async () => {
      currentRequest.resolve({ ...farm, id: 19, name: "Capril Atual 19" });
      await Promise.resolve();
    });
    await act(async () => {
      oldRequest.resolve(farm);
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Capril Atual 19");
    expect(container.textContent).not.toContain("Capril Alto Paraíso");
  });
});
