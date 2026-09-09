import { describe, expect, it } from "vitest";
import { PermissionService, isPublicEndpoint } from "./PermissionService";
import { resolvePermission } from "./permissionResolution";

describe("PermissionService public endpoints", () => {
  it("keeps catalog reads public and operational reads private", () => {
    expect(isPublicEndpoint("/goatfarms/8", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/goats", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/goats/summary", "GET")).toBe(false);
    expect(isPublicEndpoint("/goatfarms/8/goats/ABC-01", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/goats/ABC-01/genealogies", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/alerts", "GET")).toBe(false);
  });

  it("keeps administrative and operational policies distinct", () => {
    expect(PermissionService.canManageUsers("ROLE_OPERATOR")).toBe(false);
    expect(PermissionService.canManageUsers("ROLE_ADMIN")).toBe(true);
    expect(resolvePermission({
      permission: "canCreateGoat",
      userRole: "ROLE_OPERATOR",
      farmId: 7,
      canOperateFarm: true,
      canAdministerFarm: false,
      farmPermissionsLoading: false,
    })).toBe(true);
    expect(resolvePermission({
      permission: "canCreateGoat",
      userRole: "ROLE_OPERATOR",
      farmId: 7,
      canOperateFarm: false,
      canAdministerFarm: false,
      farmPermissionsLoading: false,
    })).toBe(false);
    expect(resolvePermission({
      permission: "canEditFarm",
      userRole: "ROLE_FARM_OWNER",
      userId: 7,
      resourceOwnerId: 7,
      farmId: 7,
      canOperateFarm: true,
      canAdministerFarm: true,
      farmPermissionsLoading: false,
    })).toBe(true);
  });

  it("recognizes every public authentication endpoint without substring bypasses", () => {
    expect(isPublicEndpoint("/api/v1/auth/register", "POST")).toBe(true);
    expect(isPublicEndpoint("/auth/password-reset/request", "POST")).toBe(true);
    expect(isPublicEndpoint("/auth/refresh-token", "POST")).toBe(false);
    expect(isPublicEndpoint("/evil/auth/login", "POST")).toBe(false);
  });
});
