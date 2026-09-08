import { describe, expect, it } from "vitest";
import { PermissionService, isPublicEndpoint } from "./PermissionService";

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
    expect(PermissionService.canCreateGoat("ROLE_OPERATOR")).toBe(true);
    expect(PermissionService.canEditGoat("ROLE_OPERATOR", 7, 7)).toBe(false);
    expect(PermissionService.canEditFarm("ROLE_FARM_OWNER", 7, 7)).toBe(true);
  });

  it("recognizes every public authentication endpoint without substring bypasses", () => {
    expect(isPublicEndpoint("/api/v1/auth/register", "POST")).toBe(true);
    expect(isPublicEndpoint("/auth/password-reset/request", "POST")).toBe(true);
    expect(isPublicEndpoint("/auth/refresh-token", "POST")).toBe(false);
    expect(isPublicEndpoint("/evil/auth/login", "POST")).toBe(false);
  });
});
