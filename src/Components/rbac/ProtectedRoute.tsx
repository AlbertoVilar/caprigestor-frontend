import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../Hooks/usePermissions';
import { RoleEnum } from '../../Models/auth';
import { PermissionService } from '../../services/PermissionService';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles mínimas necessárias para acessar a rota */
  requiredRoles?: RoleEnum[];
  /** Verificação de ownership - se true, verifica se o usuário é proprietário do recurso */
  requireOwnership?: boolean;
  /** ID do proprietário do recurso (para verificação de ownership) */
  resourceOwnerId?: number;
  /** Tipo de permissão específica necessária */
  permission?: 'canCreateFarm' | 'canEditFarm' | 'canDeleteFarm' | 'canViewFarm' |
              'canCreateGoat' | 'canEditGoat' | 'canDeleteGoat' | 'canViewGoat' |
              'canCreateEvent' | 'canEditEvent' | 'canDeleteEvent' | 'canViewEvent' |
              'canManageUsers' | 'canAccessReports';
  /** ID da fazenda (necessário para permissões de cabras e eventos) */
  farmId?: number;
  /** Componente a ser renderizado quando não há permissão */
  fallback?: React.ReactNode;
  /** Rota para redirecionamento quando não autenticado */
  loginRedirect?: string;
  /** Rota para redirecionamento quando não autorizado */
  unauthorizedRedirect?: string;
}

/**
 * Componente para proteção de rotas com verificações avançadas de permissões
 * Suporta verificações de roles, ownership e permissões específicas
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requireOwnership = false,
  resourceOwnerId,
  permission,
  fallback,
  loginRedirect = '/login',
  unauthorizedRedirect = '/403'
}) => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const permissions = usePermissions();

  // Verifica se está autenticado
  if (!isAuthenticated) {
    return <Navigate to={loginRedirect} replace />;
  }

  // Verifica roles necessárias
  if (requiredRoles.length > 0) {
    const userRoles = tokenPayload?.authorities ?? [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  // Verifica ownership se necessário
  if (requireOwnership && resourceOwnerId && tokenPayload?.userId) {
    const isOwner = permissions.isOwner(resourceOwnerId);
    const isAdmin = permissions.isAdmin;
    
    if (!isOwner && !isAdmin) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  // Verifica permissão específica se fornecida
  if (permission && tokenPayload) {
    const userRole = tokenPayload.authorities[0] || RoleEnum.ROLE_PUBLIC;
    const userId = tokenPayload.userId;
    let hasPermission = false;

    switch (permission) {
      case 'canCreateFarm':
        hasPermission = PermissionService.canCreateFarm(userRole);
        break;
      case 'canEditFarm':
        hasPermission = PermissionService.canEditFarm(userRole, userId, resourceOwnerId);
        break;
      case 'canDeleteFarm':
        hasPermission = PermissionService.canDeleteFarm(userRole, userId, resourceOwnerId);
        break;
      case 'canViewFarm':
        hasPermission = PermissionService.canViewFarm(userRole, userId, resourceOwnerId);
        break;
      case 'canCreateGoat':
        hasPermission = PermissionService.canCreateGoat(userRole, userId, resourceOwnerId);
        break;
      case 'canEditGoat':
        hasPermission = PermissionService.canEditGoat(userRole, userId, resourceOwnerId);
        break;
      case 'canDeleteGoat':
        hasPermission = PermissionService.canDeleteGoat(userRole, userId, resourceOwnerId);
        break;
      case 'canViewGoat':
        hasPermission = PermissionService.canViewGoat(userRole, userId, resourceOwnerId);
        break;
      case 'canCreateEvent':
        hasPermission = PermissionService.canCreateEvent(userRole, userId, resourceOwnerId);
        break;
      case 'canEditEvent':
        hasPermission = PermissionService.canEditEvent(userRole, userId, resourceOwnerId);
        break;
      case 'canDeleteEvent':
        hasPermission = PermissionService.canDeleteEvent(userRole, userId, resourceOwnerId);
        break;
      case 'canViewEvent':
        hasPermission = PermissionService.canViewEvent(userRole, userId, resourceOwnerId);
        break;
      case 'canManageUsers':
        hasPermission = PermissionService.canManageUsers(userRole);
        break;
      case 'canAccessReports':
        hasPermission = PermissionService.canAccessReports(userRole);
        break;
      default:
        hasPermission = false;
    }

    if (!hasPermission) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Hook para verificar permissões sem renderização condicional
 */
export const useRoutePermissions = () => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const permissions = usePermissions();

  const checkPermission = (props: Omit<ProtectedRouteProps, 'children'>) => {
    const {
      requiredRoles = [],
      requireOwnership = false,
      resourceOwnerId,
      permission
    } = props;

    if (!isAuthenticated) {
      return false;
    }

    // Verifica roles
    if (requiredRoles.length > 0) {
      const userRoles = tokenPayload?.authorities ?? [];
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) {
        return false;
      }
    }

    // Verifica ownership
    if (requireOwnership && resourceOwnerId && tokenPayload?.userId) {
      const isOwner = permissions.isOwner(resourceOwnerId);
      const isAdmin = permissions.isAdmin;
      if (!isOwner && !isAdmin) {
        return false;
      }
    }

    // Verifica permissão específica
    if (permission && tokenPayload) {
      const userRole = tokenPayload.authorities[0] || RoleEnum.ROLE_PUBLIC;
      const userId = tokenPayload.userId;
      
      switch (permission) {
        case 'canCreateFarm':
          return PermissionService.canCreateFarm(userRole);
        case 'canEditFarm':
          return PermissionService.canEditFarm(userRole, userId, resourceOwnerId);
        case 'canDeleteFarm':
          return PermissionService.canDeleteFarm(userRole, userId, resourceOwnerId);
        case 'canViewFarm':
          return PermissionService.canViewFarm(userRole, userId, resourceOwnerId);
        case 'canManageUsers':
          return PermissionService.canManageUsers(userRole);
        case 'canAccessReports':
          return PermissionService.canAccessReports(userRole);
        default:
          return false;
      }
    }

    return true;
  };

  return { checkPermission };
};

export default ProtectedRoute;
