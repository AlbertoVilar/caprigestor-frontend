import { RoleEnum } from '../Models/auth';

// Public endpoints that do not require authentication
export const PUBLIC_ENDPOINTS = [
  '/genealogies',
  // Do not mark '/goatfarms' as public generically here;
  // the auth lib already treats GET '/goatfarms' as public in a strict way.
  '/farms/public',
  '/goats/public',
  '/events/public',
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token'
];

/**
 * Check if an endpoint is public
 */
export const isPublicEndpoint = (url: string, method: string = 'GET'): boolean => {
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');

  if (method.toUpperCase() !== 'GET') {
    return false;
  }

  if (PUBLIC_ENDPOINTS.some(endpoint => cleanUrl.includes(endpoint))) {
    return true;
  }

  if (cleanUrl === '/goatfarms') {
    return true;
  }

  const publicRegexPatterns = [
    /^\/goatfarms\/\d+\/goats$/,
    /^\/goatfarms\/\d+$/,
    /^\/goatfarms\/\d+\/goats\/search$/
  ];

  return publicRegexPatterns.some(pattern => pattern.test(cleanUrl));
};

/**
 * Check if a user has permission based on role hierarchy
 */
export const hasRolePermission = (userRole: string, requiredRole: RoleEnum): boolean => {
  const roleHierarchy: Partial<Record<RoleEnum, number>> = {
    [RoleEnum.ROLE_PUBLIC]: 0,
    [RoleEnum.ROLE_USER]: 0,
    [RoleEnum.ROLE_FARM_OWNER]: 1,
    [RoleEnum.ROLE_OPERATOR]: 1,
    [RoleEnum.ROLE_ADMIN]: 2
  };

  const userLevel = roleHierarchy[userRole as RoleEnum] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;

  return userLevel >= requiredLevel;
};

/**
 * Check if user is resource owner
 */
export const isResourceOwner = (userId: number, resourceOwnerId: number): boolean => {
  return userId === resourceOwnerId;
};

export class PermissionService {
  static canCreateFarm(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }

  static canViewFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }

    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId)) {
      return true;
    }

    return hasRolePermission(userRole, RoleEnum.ROLE_PUBLIC);
  }

  static canEditFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }

    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId)) {
      return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
    }

    return false;
  }

  static canDeleteFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }

    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId) &&
        hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR)) {
      return true;
    }

    return false;
  }

  static canCreateGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  static canViewGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canViewFarm(userRole, userId, farmOwnerId);
  }

  static canEditGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  static canDeleteGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  // Events: backend allows ADMIN always, and OPERATOR/FARM_OWNER only if farm owner.
  static canViewEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }

    if ((hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR) || hasRolePermission(userRole, RoleEnum.ROLE_FARM_OWNER))
        && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }

    return hasRolePermission(userRole, RoleEnum.ROLE_PUBLIC);
  }

  static canCreateEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }

    if ((hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR) || hasRolePermission(userRole, RoleEnum.ROLE_FARM_OWNER))
        && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }

    return false;
  }

  static canEditEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }

    if ((hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR) || hasRolePermission(userRole, RoleEnum.ROLE_FARM_OWNER))
        && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }

    return false;
  }

  static canDeleteEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }

    if ((hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR) || hasRolePermission(userRole, RoleEnum.ROLE_FARM_OWNER))
        && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }

    return false;
  }

  static canManageUsers(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }

  static canAccessReports(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }
}
