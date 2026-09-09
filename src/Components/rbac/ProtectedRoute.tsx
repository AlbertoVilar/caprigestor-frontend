import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RoleEnum } from '../../Models/auth';
import { PermissionName, resolvePermission } from '../../services/permissionResolution';
import { useFarmPermissions } from '../../Hooks/useFarmPermissions';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles mínimas necessárias para acessar a rota */
  requiredRoles?: RoleEnum[];
  /** Verificação de ownership - se true, verifica se o usuário é proprietário do recurso */
  requireOwnership?: boolean;
  /** ID do proprietário do recurso (para verificação de ownership) */
  resourceOwnerId?: number;
  /** Tipo de permissão específica necessária */
  permission?: PermissionName;
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
  farmId,
  fallback,
  loginRedirect = '/login',
  unauthorizedRedirect = '/403'
}) => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const farmPermissions = useFarmPermissions(farmId);

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
  if (requireOwnership) {
    if (farmId == null || farmPermissions.loading || !farmPermissions.canAdministerFarm) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  // Verifica permissão específica se fornecida. Farm-scoped permissions wait
  // for the capability response and never infer access from role/ownership.
  if (permission) {
    if (farmPermissions.loading && farmId != null) {
      return null;
    }

    const hasPermission = resolvePermission({
      permission,
      userRole: tokenPayload?.authorities?.[0],
      userId: tokenPayload?.userId,
      resourceOwnerId,
      farmId,
      ...farmPermissions,
      farmPermissionsLoading: farmPermissions.loading,
    });

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

  const checkPermission = (props: Omit<ProtectedRouteProps, 'children'>) => {
    const {
      requiredRoles = [],
      requireOwnership = false,
      resourceOwnerId,
      permission,
      farmId,
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
    if (requireOwnership) {
      return false;
    }

    // Verifica permissão específica
    if (permission) {
      // The hook is intentionally synchronous; farm-scoped checks must be
      // performed by ProtectedRoute with useFarmPermissions.
      if (farmId != null) return false;
      return resolvePermission({
        permission,
        userRole: tokenPayload?.authorities?.[0],
        userId: tokenPayload?.userId,
        resourceOwnerId,
        canOperateFarm: false,
        canAdministerFarm: false,
        farmPermissionsLoading: true,
      });
    }

    return true;
  };

  return { checkPermission };
};

export default ProtectedRoute;
