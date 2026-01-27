import { RoleEnum } from '../Models/auth';

/**
 * Lista de endpoints p?blicos que n?o requerem autentica??o
 */
export const PUBLIC_ENDPOINTS = [
  '/genealogies',
  // N?o marque '/goatfarms' como p?blico genericamente aqui;
  // a lib de auth j? trata GET '/goatfarms' como p?blico de forma estrita.
  '/farms/public',
  '/goats/public',
  '/events/public',
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token'
];

/**
 * Verifica se um endpoint ? p?blico
 * @param url - URL do endpoint
 * @returns true se o endpoint for p?blico
 */
export const isPublicEndpoint = (url: string, method: string = 'GET'): boolean => {
  // Remove query parameters e barra final para verifica??o
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');

  // Para m?todos n?o-GET, n?o ? p?blico por padr?o
  if (method.toUpperCase() !== 'GET') {
    return false;
  }

  // Endpoints p?blicos gen?ricos (sempre p?blicos)
  if (PUBLIC_ENDPOINTS.some(endpoint => cleanUrl.includes(endpoint))) {
    return true;
  }

  // A listagem de fazendas '/goatfarms' ? p?blica apenas no endpoint raiz e via GET
  if (cleanUrl === '/goatfarms') {
    return true;
  }

  // Verifica endpoints din?micos p?blicos com regex (ex: /goatfarms/1/goats)
  const publicRegexPatterns = [
    /^\/goatfarms\/\d+\/goats$/,
    /^\/goatfarms\/\d+$/,
    /^\/goatfarms\/\d+\/goats\/search$/
  ];
  
  return publicRegexPatterns.some(pattern => pattern.test(cleanUrl));
};

/**
 * Verifica se o usu?rio tem permiss?o para acessar um recurso
 * @param userRole - Role do usu?rio
 * @param requiredRole - Role m?nima necess?ria
 * @returns true se o usu?rio tem permiss?o
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
 * Verifica se o usu?rio ? propriet?rio de uma fazenda
 * @param userId - ID do usu?rio
 * @param farmOwnerId - ID do propriet?rio da fazenda
 * @returns true se o usu?rio ? o propriet?rio
 */
export const isResourceOwner = (userId: number, resourceOwnerId: number): boolean => {
  return userId === resourceOwnerId;
};

/**
 * Verifica permiss?es espec?ficas para opera??es CRUD
 */
export class PermissionService {
  /**
   * Verifica se o usu?rio pode criar uma fazenda
   * Operadores e superiores podem criar fazendas
   */
  static canCreateFarm(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }

  /**
   * Verifica se o usu?rio pode visualizar uma fazenda
   */
  static canViewFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem ver tudo
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Propriet?rios e operadores podem ver suas pr?prias fazendas
    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId)) {
      return true;
    }
    
    // Fazendas p?blicas podem ser vistas por usu?rios autenticados
    return hasRolePermission(userRole, RoleEnum.ROLE_PUBLIC);
  }

  /**
   * Verifica se o usu?rio pode editar uma fazenda
   */
  static canEditFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem editar tudo
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Propriet?rios e operadores podem editar apenas suas pr?prias fazendas
    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId)) {
      return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
    }
    
    return false;
  }

  /**
   * Verifica se o usu?rio pode deletar uma fazenda
   */
  static canDeleteFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem deletar tudo
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Operadores podem deletar apenas suas pr?prias fazendas
    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId) && 
        hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR)) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica se o usu?rio pode criar cabras em uma fazenda
   */
  static canCreateGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  /**
   * Verifica se o usu?rio pode visualizar cabras
   */
  static canViewGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canViewFarm(userRole, userId, farmOwnerId);
  }

  /**
   * Verifica se o usu?rio pode editar cabras
   */
  static canEditGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  /**
   * Verifica se o usu?rio pode deletar cabras
   */
  static canDeleteGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  /**
   * Verifica se o usu?rio pode criar eventos
   * Operadores podem criar eventos em qualquer fazenda
   */
  static canCreateEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem criar eventos em qualquer lugar
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Operadores podem criar eventos (n?o precisa ser dono da fazenda)
    if (hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR)) {
      return true;
    }

    // Propriet?rios podem criar eventos apenas na pr?pria fazenda
    if (hasRolePermission(userRole, RoleEnum.ROLE_FARM_OWNER) && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }
    
    return false;
  }

  /**
   * Verifica se o usu?rio pode visualizar eventos
   * Operadores podem visualizar eventos de qualquer fazenda
   */
  static canViewEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem ver tudo
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Operadores podem ver eventos (n?o precisa ser dono da fazenda)
    if (hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR)) {
      return true;
    }

    // Propriet?rios podem ver eventos da pr?pria fazenda
    if (hasRolePermission(userRole, RoleEnum.ROLE_FARM_OWNER) && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }
    
    // Fazendas p?blicas podem ser vistas por usu?rios autenticados
    return hasRolePermission(userRole, RoleEnum.ROLE_PUBLIC);
  }

  /**
   * Verifica se o usu?rio pode editar eventos
   * Admins podem editar qualquer evento, operadores podem editar se forem donos da fazenda
   */
  static canEditEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem editar qualquer evento
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Operadores podem editar eventos se forem donos da fazenda
    if (hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR) && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }
    
    // Propriet?rios podem editar eventos se forem donos da fazenda
    if (hasRolePermission(userRole, RoleEnum.ROLE_FARM_OWNER) && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }
    
    return false;
  }

  /**
   * Verifica se o usu?rio pode deletar eventos
   * Admins podem deletar qualquer evento, operadores podem deletar se forem donos da fazenda
   */
  static canDeleteEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem deletar qualquer evento
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Operadores podem deletar eventos se forem donos da fazenda
    if (hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR) && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }
    
    // Propriet?rios podem deletar eventos se forem donos da fazenda
    if (hasRolePermission(userRole, RoleEnum.ROLE_FARM_OWNER) && userId && farmOwnerId) {
      return isResourceOwner(userId, farmOwnerId);
    }
    
    return false;
  }

  /**
   * Verifica se o usu?rio pode gerenciar outros usu?rios
   * Operadores e superiores podem gerenciar usu?rios
   */
  static canManageUsers(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }

  /**
   * Verifica se o usu?rio pode acessar relat?rios administrativos
   * Operadores e superiores podem acessar relat?rios
   */
  static canAccessReports(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }
}
