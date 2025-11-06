// Componentes de controle de acesso baseado em roles (RBAC)
export { ProtectedRoute, useRoutePermissions } from './ProtectedRoute';
export type { ProtectedRouteProps } from './ProtectedRoute';

export { PermissionButton } from './PermissionButton';
export type { PermissionButtonProps } from './PermissionButton';

export { PermissionWrapper, usePermissionCheck } from './PermissionWrapper';
export type { PermissionWrapperProps } from './PermissionWrapper';

// Re-exporta guards existentes se houver
export * from './guards';

// Tipos comuns para permissões
export type PermissionType = 
  | 'canCreateFarm' 
  | 'canEditFarm' 
  | 'canDeleteFarm' 
  | 'canViewFarm'
  | 'canCreateGoat' 
  | 'canEditGoat' 
  | 'canDeleteGoat' 
  | 'canViewGoat'
  | 'canCreateEvent' 
  | 'canEditEvent' 
  | 'canDeleteEvent' 
  | 'canViewEvent'
  | 'canManageUsers' 
  | 'canAccessReports';

export type OperatorType = 'AND' | 'OR';

/**
 * Utilitários para facilitar o uso dos componentes RBAC
 */
export const RBAC_UTILS = {
  /**
   * Cria props padrão para verificação de ownership de fazenda
   */
  farmOwnership: (farmOwnerId: number) => ({
    requireOwnership: true,
    resourceOwnerId: farmOwnerId
  }),
  
  /**
   * Cria props padrão para verificação de role admin
   */
  adminOnly: () => ({
    requiredRoles: ['ROLE_ADMIN' as const]
  }),
  
  /**
   * Cria props padrão para verificação de role operator ou admin
   */
  farmOwnerOrAbove: () => ({
    requiredRoles: ['ROLE_OPERATOR' as const, 'ROLE_ADMIN' as const],
    operator: 'OR' as const
  }),
  
  /**
   * Cria props padrão para verificação de role operator ou superior
   */
  operatorOrAbove: () => ({
    requiredRoles: ['ROLE_OPERATOR' as const, 'ROLE_ADMIN' as const],
    operator: 'OR' as const
  })
};