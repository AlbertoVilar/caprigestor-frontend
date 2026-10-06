// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoatActionPanel from "./GoatActionPanel";

const navigateSpy = vi.fn();
const farmPermissionState = vi.hoisted(() => ({
  canOperateFarm: true,
  canAdministerFarm: true,
  loading: false,
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => navigateSpy }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/Hooks/useFarmPermissions", () => ({
  useFarmPermissions: () => ({ ...farmPermissionState }),
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

describe("GoatActionPanel event actions", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    farmPermissionState.canOperateFarm = true;
    farmPermissionState.canAdministerFarm = true;
    farmPermissionState.loading = false;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("sends new-event and edit-history actions to different handlers", () => {
    const onShowEventForm = vi.fn();
    const onOpenEventHistory = vi.fn();

    act(() => {
      root.render(
        <GoatActionPanel
          registrationNumber="1615325001"
          farmId={12}
          onShowEventForm={onShowEventForm}
          onOpenEventHistory={onOpenEventHistory}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const newEventButton = buttons.find((button) => button.textContent?.includes("Novo evento"));
    const editEventButton = buttons.find((button) => button.textContent?.includes("Editar evento"));

    expect(newEventButton).toBeTruthy();
    expect(editEventButton).toBeTruthy();

    act(() => newEventButton?.click());
    expect(onShowEventForm).toHaveBeenCalledOnce();
    expect(onOpenEventHistory).not.toHaveBeenCalled();

    act(() => editEventButton?.click());
    expect(onOpenEventHistory).toHaveBeenCalledOnce();
    expect(onShowEventForm).toHaveBeenCalledOnce();
  });
});
