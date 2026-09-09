import { RoleEnum } from "../Models/auth";
import { isPublicEndpoint } from "../utils/auth-contract";

export { isPublicEndpoint };

const hasRole = (userRole: string, role: RoleEnum): boolean => userRole === role;
const isAdmin = (userRole: string): boolean => hasRole(userRole, RoleEnum.ROLE_ADMIN);
const isOwnerRole = (userRole: string): boolean => hasRole(userRole, RoleEnum.ROLE_FARM_OWNER);
const isOperatorRole = (userRole: string): boolean => hasRole(userRole, RoleEnum.ROLE_OPERATOR);

export const hasRolePermission = (userRole: string, requiredRole: RoleEnum): boolean => {
  if (requiredRole === RoleEnum.ROLE_PUBLIC) return true;
  return userRole === requiredRole;
};

/** Permissions whose decision is scoped to a concrete farm. */
export type FarmScopedPermission =
  | 'canEditFarm'
  | 'canDeleteFarm'
  | 'canCreateGoat'
  | 'canEditGoat'
  | 'canDeleteGoat'
  | 'canViewGoat'
  | 'canCreateEvent'
  | 'canEditEvent'
  | 'canDeleteEvent'
  | 'canViewEvent';

const FARM_SCOPED_PERMISSIONS = new Set<FarmScopedPermission>([
  'canEditFarm',
  'canDeleteFarm',
  'canCreateGoat',
  'canEditGoat',
  'canDeleteGoat',
  'canViewGoat',
  'canCreateEvent',
  'canEditEvent',
  'canDeleteEvent',
  'canViewEvent',
]);

export const isFarmScopedPermission = (
  permission: string
): permission is FarmScopedPermission =>
  FARM_SCOPED_PERMISSIONS.has(permission as FarmScopedPermission);

/** Maps a farm-scoped permission to the capability returned by the backend. */
export const farmCapabilityFor = (
  permission: FarmScopedPermission
): 'operate' | 'administer' =>
  permission === 'canEditFarm' ||
  permission === 'canDeleteFarm' ||
  permission === 'canEditGoat' ||
  permission === 'canDeleteGoat' ||
  permission === 'canEditEvent' ||
  permission === 'canDeleteEvent'
    ? 'administer'
    : 'operate';

/** UI policy mirrors the backend annotations; farm linkage remains server-authoritative. */
export class PermissionService {
  // Farm creation is administrative (the public onboarding flow uses /auth/register-farm).
  static canCreateFarm(userRole: string): boolean {
    return isAdmin(userRole) || isOwnerRole(userRole);
  }

  // Farm reads and catalog reads are public; authenticated users can also view them.
  static canViewFarm(_userRole: string, _userId?: number, _farmOwnerId?: number): boolean {
    void _userRole; void _userId; void _farmOwnerId;
    return true;
  }

  // Reopening an event is administrative and remains available to the
  // components that already receive an explicit farm capability.

  // /api/v1/users/** is @AdminOnly in the backend.
  static canManageUsers(userRole: string): boolean {
    return isAdmin(userRole);
  }

  static canAccessReports(userRole: string): boolean {
    return isAdmin(userRole) || isOwnerRole(userRole) || isOperatorRole(userRole);
  }
}
