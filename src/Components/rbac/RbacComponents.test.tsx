import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { type ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleEnum } from "../../Models/auth";
import PermissionButton from "./PermissionButton";
import PermissionWrapper from "./PermissionWrapper";
import ProtectedRoute from "./ProtectedRoute";
import { IfAnyRole, IfAuthenticated, IfCanManage } from "./guards";

type TestAuthState = {
  isAuthenticated: boolean;
  tokenPayload?: { userId: number; authorities: string[] };
};

const state = vi.hoisted(() => ({
  auth: {
    isAuthenticated: true,
    tokenPayload: { userId: 10, authorities: ["ROLE_OPERATOR"] },
  } as TestAuthState,
  farm: {
    canOperateFarm: true,
    canAdministerFarm: false,
    loading: false,
  },
}));

vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => state.auth }));
vi.mock("../../Hooks/useFarmPermissions", () => ({ useFarmPermissions: () => state.farm }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => state.auth }));
vi.mock("@/Hooks/useFarmPermissions", () => ({ useFarmPermissions: () => state.farm }));

function render(element: ReactElement) {
  return renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
}

describe("farm-scoped RBAC components", () => {
  beforeEach(() => {
    state.auth = {
      isAuthenticated: true,
      tokenPayload: { userId: 10, authorities: ["ROLE_OPERATOR"] },
    };
    state.farm = { canOperateFarm: true, canAdministerFarm: false, loading: false };
  });

  it("keeps PermissionWrapper authentication, role and custom conditions fail-closed", () => {
    state.auth = { isAuthenticated: false, tokenPayload: undefined };
    expect(render(<PermissionWrapper fallback={<span>denied</span>}><span>private</span></PermissionWrapper>)).toContain("denied");

    state.auth = {
      isAuthenticated: true,
      tokenPayload: { userId: 10, authorities: ["ROLE_OPERATOR"] },
    };
    expect(render(<PermissionWrapper requiredRoles={[RoleEnum.ROLE_ADMIN]} fallback={<span>denied</span>}><span>admin</span></PermissionWrapper>)).toContain("denied");
    expect(render(<PermissionWrapper requiredRoles={[RoleEnum.ROLE_OPERATOR]}><span>operator</span></PermissionWrapper>)).toContain("operator");
    expect(render(<PermissionWrapper customCheck={() => false} fallback={<span>denied</span>}><span>custom</span></PermissionWrapper>)).toContain("denied");
    expect(render(<PermissionWrapper requiredRoles={[RoleEnum.ROLE_ADMIN]} customCheck={() => true} operator="OR"><span>or-pass</span></PermissionWrapper>)).toContain("or-pass");
  });

  it("uses backend capabilities for operational and administrative wrapper permissions", () => {
    expect(render(<PermissionWrapper permission="canCreateGoat" farmId={7}><span>operate</span></PermissionWrapper>)).toContain("operate");
    expect(render(<PermissionWrapper permission="canEditFarm" farmId={7} fallback={<span>denied</span>}><span>admin</span></PermissionWrapper>)).toContain("denied");
    state.farm.canAdministerFarm = true;
    expect(render(<PermissionWrapper requireOwnership farmId={7}><span>owner</span></PermissionWrapper>)).toContain("owner");
    state.farm.loading = true;
    expect(render(<PermissionWrapper permission="canCreateGoat" farmId={7} fallback={<span>denied</span>}><span>loading</span></PermissionWrapper>)).toContain("denied");
  });

  it("renders PermissionButton hidden, disabled or enabled according to capability", () => {
    state.auth = { isAuthenticated: false, tokenPayload: undefined };
    expect(render(<PermissionButton fallback={<span>denied</span>}>action</PermissionButton>)).toContain("denied");
    expect(render(<PermissionButton disableInsteadOfHide>action</PermissionButton>)).toContain("disabled");

    state.auth = {
      isAuthenticated: true,
      tokenPayload: { userId: 10, authorities: ["ROLE_OPERATOR"] },
    };
    state.farm.canOperateFarm = false;
    expect(render(<PermissionButton permission="canCreateEvent" farmId={7} disableInsteadOfHide>event</PermissionButton>)).toContain("disabled");
    state.farm.canOperateFarm = true;
    expect(render(<PermissionButton permission="canCreateEvent" farmId={7}>event</PermissionButton>)).toContain("event");
  });

  it("keeps ProtectedRoute redirects and capability loading fail-closed", () => {
    state.auth = { isAuthenticated: false, tokenPayload: undefined };
    expect(render(<ProtectedRoute><span>private</span></ProtectedRoute>)).not.toContain("private");

    state.auth = {
      isAuthenticated: true,
      tokenPayload: { userId: 10, authorities: ["ROLE_OPERATOR"] },
    };
    expect(render(<ProtectedRoute requiredRoles={[RoleEnum.ROLE_ADMIN]} fallback={<span>denied</span>}><span>admin</span></ProtectedRoute>)).toContain("denied");
    state.farm.loading = true;
    expect(render(<ProtectedRoute permission="canCreateGoat" farmId={7}><span>loading</span></ProtectedRoute>)).toBe("");
    state.farm.loading = false;
    state.farm.canOperateFarm = false;
    expect(render(<ProtectedRoute permission="canCreateGoat" farmId={7} fallback={<span>denied</span>}><span>operate</span></ProtectedRoute>)).toContain("denied");
    state.farm.canOperateFarm = true;
    expect(render(<ProtectedRoute permission="canCreateGoat" farmId={7}><span>operate</span></ProtectedRoute>)).toContain("operate");
  });

  it("uses explicit administration capability for ProtectedRoute ownership", () => {
    expect(render(<ProtectedRoute requireOwnership farmId={7} fallback={<span>denied</span>}><span>owner</span></ProtectedRoute>)).toContain("denied");
    state.farm.canAdministerFarm = true;
    expect(render(<ProtectedRoute requireOwnership farmId={7}><span>owner</span></ProtectedRoute>)).toContain("owner");
  });
});

describe("simple RBAC guards", () => {
  beforeEach(() => {
    state.auth = {
      isAuthenticated: true,
      tokenPayload: { userId: 10, authorities: ["ROLE_OPERATOR"] },
    };
    state.farm = { canOperateFarm: true, canAdministerFarm: false, loading: false };
  });

  it("covers authentication, farm operation and role guards", () => {
    expect(render(<IfAuthenticated><span>auth</span></IfAuthenticated>)).toContain("auth");
    state.auth.isAuthenticated = false;
    expect(render(<IfAuthenticated><span>auth</span></IfAuthenticated>)).not.toContain("auth");
    expect(render(<IfCanManage farmId={4}><span>manage</span></IfCanManage>)).not.toContain("manage");
    state.auth.isAuthenticated = true;
    expect(render(<IfCanManage farmId={4}><span>manage</span></IfCanManage>)).toContain("manage");
    state.farm.loading = true;
    expect(render(<IfCanManage farmId={4}><span>manage</span></IfCanManage>)).not.toContain("manage");
    state.farm.loading = false;
    expect(render(<IfAnyRole roles={[RoleEnum.ROLE_OPERATOR]}><span>role</span></IfAnyRole>)).toContain("role");
    expect(render(<IfAnyRole roles={[RoleEnum.ROLE_ADMIN]}><span>role</span></IfAnyRole>)).not.toContain("role");
  });
});
