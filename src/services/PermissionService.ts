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

export const isResourceOwner = (userId: number, resourceOwnerId: number): boolean =>
  Number(userId) === Number(resourceOwnerId);

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

  // Backend @FarmOwnerOnly: ADMIN or FARM_OWNER of the target farm.
  static canEditFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return isAdmin(userRole) || (isOwnerRole(userRole) && userId != null && farmOwnerId != null && isResourceOwner(userId, farmOwnerId));
  }

  static canDeleteFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  // Backend @CanManageFarm: ADMIN, FARM_OWNER of the farm, or linked OPERATOR.
  // The server validates the operator-farm link; the client must not infer it from ownerId.
  static canCreateGoat(userRole: string, _userId?: number, _farmOwnerId?: number): boolean {
    void _userId; void _farmOwnerId;
    return isAdmin(userRole) || isOwnerRole(userRole) || isOperatorRole(userRole);
  }

  static canViewGoat(_userRole: string, _userId?: number, _farmOwnerId?: number): boolean {
    void _userRole; void _userId; void _farmOwnerId;
    return true;
  }

  // Goat update/exit/delete remain @FarmOwnerOnly in the backend.
  static canEditGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  static canDeleteGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditGoat(userRole, userId, farmOwnerId);
  }

  static canViewEvent(_userRole: string, _userId?: number, _farmOwnerId?: number): boolean {
    void _userRole; void _userId; void _farmOwnerId;
    return true;
  }

  static canCreateEvent(userRole: string, _userId?: number, _farmOwnerId?: number): boolean {
    void _userId; void _farmOwnerId;
    return isAdmin(userRole) || isOwnerRole(userRole) || isOperatorRole(userRole);
  }

  static canEditEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  static canDeleteEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditEvent(userRole, userId, farmOwnerId);
  }

  static canReopenEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  // /api/v1/users/** is @AdminOnly in the backend.
  static canManageUsers(userRole: string): boolean {
    return isAdmin(userRole);
  }

  static canAccessReports(userRole: string): boolean {
    return isAdmin(userRole) || isOwnerRole(userRole) || isOperatorRole(userRole);
  }
}
