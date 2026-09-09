import React from 'react';
import { RoleEnum } from '../../Models/auth';
import { PermissionName } from '../../services/permissionResolution';
import { resolvePermission } from '../../services/permissionResolution';
import { useAuth } from '../../contexts/AuthContext';
import { useFarmPermissions } from '../../Hooks/useFarmPermissions';

export interface PermissionWrapperProps {
  children: React.ReactNode;
  /** Roles necessárias para mostrar o conteúdo */
  requiredRoles?: RoleEnum[];
  /** Verificação de ownership */
  requireOwnership?: boolean;
  /** ID do proprietário do recurso */
  resourceOwnerId?: number;
  /** Permissão específica necessária */
  permission?: PermissionName;
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
  const farmPermissions = useFarmPermissions(farmId);

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
  if (requireOwnership) {
    conditions.push(
      farmId != null && !farmPermissions.loading && farmPermissions.canAdministerFarm
    );
  }

  // Verifica permissão específica se fornecida
  if (permission) {
    conditions.push(resolvePermission({
      permission,
      userRole: tokenPayload?.authorities?.[0],
      userId: tokenPayload?.userId,
      resourceOwnerId,
      farmId,
      ...farmPermissions,
      farmPermissionsLoading: farmPermissions.loading,
    }));
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

  const checkPermission = (props: Omit<PermissionWrapperProps, 'children'>) => {
    const {
      requiredRoles = [],
      requireOwnership = false,
      resourceOwnerId,
      permission,
      farmId,
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
    if (requireOwnership) {
      conditions.push(false);
    }

    // Verifica permissão específica
    if (permission) {
      // This synchronous helper cannot fetch capabilities. Callers that need
      // farm-scoped checks should use PermissionWrapper or PermissionButton.
      if (farmId != null) {
        conditions.push(false);
      } else {
        conditions.push(resolvePermission({
          permission,
          userRole: tokenPayload?.authorities?.[0],
          userId: tokenPayload?.userId,
          resourceOwnerId,
          canOperateFarm: false,
          canAdministerFarm: false,
          farmPermissionsLoading: true,
        }));
      }
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
