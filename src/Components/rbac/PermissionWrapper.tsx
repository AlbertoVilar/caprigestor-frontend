import React from 'react';
import { usePermissions } from '../../Hooks/usePermissions';
import { RoleEnum } from '../../Models/auth';
import { PermissionService } from '../../services/PermissionService';
import { useAuth } from '../../contexts/AuthContext';

export interface PermissionWrapperProps {
  children: React.ReactNode;
  /** Roles necessárias para mostrar o conteúdo */
  requiredRoles?: RoleEnum[];
  /** Verificação de ownership */
  requireOwnership?: boolean;
  /** ID do proprietário do recurso */
  resourceOwnerId?: number;
  /** Permissão específica necessária */
  permission?: 'canCreateFarm' | 'canEditFarm' | 'canDeleteFarm' | 'canViewFarm' |
              'canCreateGoat' | 'canEditGoat' | 'canDeleteGoat' | 'canViewGoat' |
              'canCreateEvent' | 'canEditEvent' | 'canDeleteEvent' | 'canViewEvent' |
              'canManageUsers' | 'canAccessReports';
  /** ID da fazenda (para permissões de cabras/eventos) */
  farmId?: number;
  /** Componente alternativo quando não há permissão */
  fallback?: React.ReactNode;
  /** Se true, requer autenticação */
  requireAuth?: boolean;
  /** Validação adicional customizada */
  customCheck?: () => boolean;
  /** Operador lógico para múltiplas condições (AND/OR) */
  operator?: 'AND' | 'OR';
}

/**
 * Componente wrapper que controla a visibilidade do conteúdo baseado em permissões
 * Mais flexível que o PermissionButton, pode envolver qualquer conteúdo
 */
export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  requiredRoles = [],
  requireOwnership = false,
  resourceOwnerId,
  permission,
  farmId,
  fallback = null,
  requireAuth = true,
  customCheck,
  operator = 'AND'
}) => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const permissions = usePermissions();

  // Verifica se está autenticado (se necessário)
  if (requireAuth && !isAuthenticated) {
    return fallback as React.ReactElement;
  }

  const conditions: boolean[] = [];

  // Verifica roles necessárias
  if (requiredRoles.length > 0) {
    const userRoles = tokenPayload?.authorities ?? [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    conditions.push(hasRequiredRole);
  }

  // Verifica ownership se necessário
  if (requireOwnership && resourceOwnerId && tokenPayload?.userId) {
    const isOwner = permissions.isOwner(resourceOwnerId);
    const isAdmin = permissions.isAdmin();
    conditions.push(isOwner || isAdmin);
  }

  // Verifica permissão específica se fornecida
  if (permission && tokenPayload) {
    const userRole = tokenPayload.authorities[0] || RoleEnum.ROLE_PUBLIC;
    const userId = tokenPayload.userId;
    let hasSpecificPermission = false;

    switch (permission) {
      case 'canCreateFarm':
        hasSpecificPermission = PermissionService.canCreateFarm(userRole);
        break;
      case 'canEditFarm':
        hasSpecificPermission = PermissionService.canEditFarm(userRole, userId, resourceOwnerId);
        break;
      case 'canDeleteFarm':
        hasSpecificPermission = PermissionService.canDeleteFarm(userRole, userId, resourceOwnerId);
        break;
      case 'canViewFarm':
        hasSpecificPermission = PermissionService.canViewFarm(userRole, userId, resourceOwnerId);
        break;
      case 'canCreateGoat':
        hasSpecificPermission = PermissionService.canCreateGoat(userRole, userId, resourceOwnerId);
        break;
      case 'canEditGoat':
        hasSpecificPermission = PermissionService.canEditGoat(userRole, userId, resourceOwnerId);
        break;
      case 'canDeleteGoat':
        hasSpecificPermission = PermissionService.canDeleteGoat(userRole, userId, resourceOwnerId);
        break;
      case 'canViewGoat':
        hasSpecificPermission = PermissionService.canViewGoat(userRole, userId, resourceOwnerId);
        break;
      case 'canCreateEvent':
        hasSpecificPermission = PermissionService.canCreateEvent(userRole, userId, resourceOwnerId);
        break;
      case 'canEditEvent':
        hasSpecificPermission = PermissionService.canEditEvent(userRole, userId, resourceOwnerId);
        break;
      case 'canDeleteEvent':
        hasSpecificPermission = PermissionService.canDeleteEvent(userRole, userId, resourceOwnerId);
        break;
      case 'canViewEvent':
        hasSpecificPermission = PermissionService.canViewEvent(userRole, userId, resourceOwnerId);
        break;
      case 'canManageUsers':
        hasSpecificPermission = PermissionService.canManageUsers(userRole);
        break;
      case 'canAccessReports':
        hasSpecificPermission = PermissionService.canAccessReports(userRole);
        break;
      default:
        hasSpecificPermission = false;
    }

    conditions.push(hasSpecificPermission);
  }

  // Validação customizada (ex.: regras específicas do componente)
  if (customCheck) {
    conditions.push(customCheck());
  }

  // Se não há condições, permite acesso
  if (conditions.length === 0) {
    return <>{children}</>;
  }

  // Aplica operador lógico
  const hasPermission = operator === 'AND' 
    ? conditions.every(condition => condition)
    : conditions.some(condition => condition);

  // Renderiza conteúdo ou fallback
  return hasPermission ? <>{children}</> : (fallback as React.ReactElement);
};

/**
 * Hook para verificar permissões sem renderização
 */
export const usePermissionCheck = () => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const permissions = usePermissions();

  const checkPermission = (props: Omit<PermissionWrapperProps, 'children'>) => {
    const {
      requiredRoles = [],
      requireOwnership = false,
      resourceOwnerId,
      permission,
      requireAuth = true,
      customCheck,
      operator = 'AND'
    } = props;

    if (requireAuth && !isAuthenticated) {
      return false;
    }

    const conditions: boolean[] = [];

    // Verifica roles
    if (requiredRoles.length > 0) {
      const userRoles = tokenPayload?.authorities ?? [];
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      conditions.push(hasRequiredRole);
    }

    // Verifica ownership
    if (requireOwnership && resourceOwnerId && tokenPayload?.userId) {
      const isOwner = permissions.isOwner(resourceOwnerId);
      const isAdmin = permissions.isAdmin();
      conditions.push(isOwner || isAdmin);
    }

    // Verifica permissão específica
    if (permission && tokenPayload) {
      const userRole = tokenPayload.authorities[0] || RoleEnum.ROLE_PUBLIC;
      const userId = tokenPayload.userId;
      
      let hasSpecificPermission = false;
      switch (permission) {
        case 'canCreateFarm':
          hasSpecificPermission = PermissionService.canCreateFarm(userRole);
          break;
        case 'canEditFarm':
          hasSpecificPermission = PermissionService.canEditFarm(userRole, userId, resourceOwnerId);
          break;
        case 'canDeleteFarm':
          hasSpecificPermission = PermissionService.canDeleteFarm(userRole, userId, resourceOwnerId);
          break;
        case 'canViewFarm':
          hasSpecificPermission = PermissionService.canViewFarm(userRole, userId, resourceOwnerId);
          break;
        case 'canManageUsers':
          hasSpecificPermission = PermissionService.canManageUsers(userRole);
          break;
        case 'canAccessReports':
          hasSpecificPermission = PermissionService.canAccessReports(userRole);
          break;
        default:
          hasSpecificPermission = false;
      }
      conditions.push(hasSpecificPermission);
    }

    if (customCheck) {
      conditions.push(customCheck());
    }

    if (conditions.length === 0) {
      return true;
    }

    return operator === 'AND' 
      ? conditions.every(condition => condition)
      : conditions.some(condition => condition);
  };

  return { checkPermission };
};

export default PermissionWrapper;
