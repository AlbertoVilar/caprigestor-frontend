import { RoleEnum } from '../Models/auth';

/**
 * Lista de endpoints públicos que não requerem autenticação
 */
export const PUBLIC_ENDPOINTS = [
  '/genealogies',
  // Não marque '/goatfarms' como público genericamente aqui;
  // a lib de auth já trata GET '/goatfarms' como público de forma estrita.
  '/farms/public',
  '/goats/public',
  '/events/public',
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token'
];

/**
 * Verifica se um endpoint é público
 * @param url - URL do endpoint
 * @returns true se o endpoint for público
 */
export const isPublicEndpoint = (url: string, method: string = 'GET'): boolean => {
  // Remove query parameters e barra final para verificação
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');

  // Para métodos não-GET, não é público por padrão
  if (method.toUpperCase() !== 'GET') {
    return false;
  }

  // Endpoints públicos genéricos (sempre públicos)
  if (PUBLIC_ENDPOINTS.some(endpoint => cleanUrl.includes(endpoint))) {
    return true;
  }

  // A listagem de fazendas '/goatfarms' é pública apenas no endpoint raiz e via GET
  return cleanUrl === '/goatfarms';
};

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 * @param userRole - Role do usuário
 * @param requiredRole - Role mínima necessária
 * @returns true se o usuário tem permissão
 */
export const hasRolePermission = (userRole: string, requiredRole: RoleEnum): boolean => {
  const roleHierarchy = {
    [RoleEnum.ROLE_PUBLIC]: 0,
    [RoleEnum.ROLE_OPERATOR]: 1,
    [RoleEnum.ROLE_ADMIN]: 2
  };

  const userLevel = roleHierarchy[userRole as RoleEnum] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;

  return userLevel >= requiredLevel;
};

/**
 * Verifica se o usuário é proprietário de uma fazenda
 * @param userId - ID do usuário
 * @param farmOwnerId - ID do proprietário da fazenda
 * @returns true se o usuário é o proprietário
 */
export const isResourceOwner = (userId: number, resourceOwnerId: number): boolean => {
  return userId === resourceOwnerId;
};

/**
 * Verifica permissões específicas para operações CRUD
 */
export class PermissionService {
  /**
   * Verifica se o usuário pode criar uma fazenda
   * Operadores e superiores podem criar fazendas
   */
  static canCreateFarm(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }

  /**
   * Verifica se o usuário pode visualizar uma fazenda
   */
  static canViewFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem ver tudo
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Proprietários e operadores podem ver suas próprias fazendas
    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId)) {
      return true;
    }
    
    // Fazendas públicas podem ser vistas por usuários autenticados
    return hasRolePermission(userRole, RoleEnum.ROLE_PUBLIC);
  }

  /**
   * Verifica se o usuário pode editar uma fazenda
   */
  static canEditFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem editar tudo
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Proprietários e operadores podem editar apenas suas próprias fazendas
    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId)) {
      return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
    }
    
    return false;
  }

  /**
   * Verifica se o usuário pode deletar uma fazenda
   */
  static canDeleteFarm(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem deletar tudo
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Operadores podem deletar apenas suas próprias fazendas
    if (userId && farmOwnerId && isResourceOwner(userId, farmOwnerId) && 
        hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR)) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica se o usuário pode criar cabras em uma fazenda
   */
  static canCreateGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  /**
   * Verifica se o usuário pode visualizar cabras
   */
  static canViewGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canViewFarm(userRole, userId, farmOwnerId);
  }

  /**
   * Verifica se o usuário pode editar cabras
   */
  static canEditGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  /**
   * Verifica se o usuário pode deletar cabras
   */
  static canDeleteGoat(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    return this.canEditFarm(userRole, userId, farmOwnerId);
  }

  /**
   * Verifica se o usuário pode criar eventos
   * Operadores podem criar eventos em qualquer fazenda
   */
  static canCreateEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem criar eventos em qualquer lugar
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Operadores podem criar eventos (não precisa ser dono da fazenda)
    if (hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR)) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica se o usuário pode visualizar eventos
   * Operadores podem visualizar eventos de qualquer fazenda
   */
  static canViewEvent(userRole: string, userId?: number, farmOwnerId?: number): boolean {
    // Admins podem ver tudo
    if (hasRolePermission(userRole, RoleEnum.ROLE_ADMIN)) {
      return true;
    }
    
    // Operadores podem ver eventos (não precisa ser dono da fazenda)
    if (hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR)) {
      return true;
    }
    
    // Fazendas públicas podem ser vistas por usuários autenticados
    return hasRolePermission(userRole, RoleEnum.ROLE_PUBLIC);
  }

  /**
   * Verifica se o usuário pode editar eventos
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
    
    return false;
  }

  /**
   * Verifica se o usuário pode deletar eventos
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
    
    return false;
  }

  /**
   * Verifica se o usuário pode gerenciar outros usuários
   * Operadores e superiores podem gerenciar usuários
   */
  static canManageUsers(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }

  /**
   * Verifica se o usuário pode acessar relatórios administrativos
   * Operadores e superiores podem acessar relatórios
   */
  static canAccessReports(userRole: string): boolean {
    return hasRolePermission(userRole, RoleEnum.ROLE_OPERATOR);
  }
}