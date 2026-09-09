import { describe, expect, it } from "vitest";
import { RoleEnum } from "../Models/auth";
import {
  PermissionService,
  farmCapabilityFor,
  hasRolePermission,
  isFarmScopedPermission,
  isPublicEndpoint,
} from "./PermissionService";
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

  it("fails closed for unresolved farm capabilities", () => {
    expect(resolvePermission({
      permission: "canCreateGoat",
      farmId: 7,
      canOperateFarm: true,
      canAdministerFarm: true,
      farmPermissionsLoading: true,
    })).toBe(false);
    expect(resolvePermission({
      permission: "canEditFarm",
      canOperateFarm: true,
      canAdministerFarm: true,
      farmPermissionsLoading: false,
    })).toBe(false);
  });

  it("maps operational and administrative farm permissions to the correct capability", () => {
    const operational = ["canCreateGoat", "canViewGoat", "canCreateEvent", "canViewEvent"] as const;
    const administrative = ["canEditFarm", "canDeleteFarm", "canEditGoat", "canDeleteGoat", "canEditEvent", "canDeleteEvent"] as const;

    for (const permission of operational) {
      expect(isFarmScopedPermission(permission)).toBe(true);
      expect(farmCapabilityFor(permission)).toBe("operate");
      expect(resolvePermission({ permission, farmId: 7, canOperateFarm: true, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(true);
      expect(resolvePermission({ permission, farmId: 7, canOperateFarm: false, canAdministerFarm: true, farmPermissionsLoading: false })).toBe(false);
    }
    for (const permission of administrative) {
      expect(isFarmScopedPermission(permission)).toBe(true);
      expect(farmCapabilityFor(permission)).toBe("administer");
      expect(resolvePermission({ permission, farmId: 7, canOperateFarm: true, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(false);
      expect(resolvePermission({ permission, farmId: 7, canOperateFarm: false, canAdministerFarm: true, farmPermissionsLoading: false })).toBe(true);
    }
  });

  it("keeps global permission policies explicit", () => {
    expect(isFarmScopedPermission("canCreateFarm")).toBe(false);
    expect(hasRolePermission("ROLE_PUBLIC", RoleEnum.ROLE_PUBLIC)).toBe(true);
    expect(hasRolePermission("ROLE_OPERATOR", RoleEnum.ROLE_ADMIN)).toBe(false);
    expect(resolvePermission({ permission: "canCreateFarm", userRole: RoleEnum.ROLE_ADMIN, canOperateFarm: false, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(true);
    expect(resolvePermission({ permission: "canCreateFarm", userRole: RoleEnum.ROLE_OPERATOR, canOperateFarm: false, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(false);
    expect(resolvePermission({ permission: "canViewFarm", userRole: RoleEnum.ROLE_PUBLIC, canOperateFarm: false, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(true);
    expect(resolvePermission({ permission: "canManageUsers", userRole: RoleEnum.ROLE_ADMIN, canOperateFarm: false, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(true);
    expect(resolvePermission({ permission: "canManageUsers", userRole: RoleEnum.ROLE_FARM_OWNER, canOperateFarm: false, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(false);
    expect(resolvePermission({ permission: "canAccessReports", userRole: RoleEnum.ROLE_OPERATOR, canOperateFarm: false, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(true);
    expect(resolvePermission({ permission: "canAccessReports", userRole: RoleEnum.ROLE_PUBLIC, canOperateFarm: false, canAdministerFarm: false, farmPermissionsLoading: false })).toBe(false);
  });
});
