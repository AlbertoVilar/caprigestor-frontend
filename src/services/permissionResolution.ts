import { RoleEnum } from "../Models/auth";
import {
  farmCapabilityFor,
  isFarmScopedPermission,
  PermissionService,
} from "./PermissionService";

export { isFarmScopedPermission } from "./PermissionService";

export type PermissionName =
  | "canCreateFarm"
  | "canEditFarm"
  | "canDeleteFarm"
  | "canViewFarm"
  | "canCreateGoat"
  | "canEditGoat"
  | "canDeleteGoat"
  | "canViewGoat"
  | "canCreateEvent"
  | "canEditEvent"
  | "canDeleteEvent"
  | "canViewEvent"
  | "canManageUsers"
  | "canAccessReports";

export interface PermissionResolutionContext {
  permission: PermissionName;
  userRole?: string;
  userId?: number;
  resourceOwnerId?: number;
  farmId?: number;
  canOperateFarm: boolean;
  canAdministerFarm: boolean;
  farmPermissionsLoading: boolean;
}

/**
 * Resolves UI permissions without inferring farm access from a role or owner
 * id. Farm-scoped decisions are valid only after the backend capability
 * endpoint has answered for the concrete farm.
 */
export function resolvePermission({
  permission,
  userRole = RoleEnum.ROLE_PUBLIC,
  userId,
  resourceOwnerId,
  farmId,
  canOperateFarm,
  canAdministerFarm,
  farmPermissionsLoading,
}: PermissionResolutionContext): boolean {
  if (isFarmScopedPermission(permission)) {
    if (farmId == null || farmPermissionsLoading) return false;
    return farmCapabilityFor(permission) === "administer"
      ? canAdministerFarm
      : canOperateFarm;
  }

  switch (permission) {
    case "canCreateFarm":
      return PermissionService.canCreateFarm(userRole);
    case "canViewFarm":
      return PermissionService.canViewFarm(userRole, userId, resourceOwnerId);
    case "canManageUsers":
      return PermissionService.canManageUsers(userRole);
    case "canAccessReports":
      return PermissionService.canAccessReports(userRole);
    default:
      return false;
  }
}
