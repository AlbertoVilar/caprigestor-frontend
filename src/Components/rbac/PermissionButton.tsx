import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { RoleEnum } from '../../Models/auth';
import { PermissionService } from '../../services/PermissionService';
import { useAuth } from '../../contexts/AuthContext';

export interface PermissionButtonProps {
  children: React.ReactNode;
  /** Roles necessárias para mostrar o botão */
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
  /** Se true, desabilita o botão ao invés de escondê-lo */
  disableInsteadOfHide?: boolean;
  /** Props adicionais para o botão */
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente que renderiza um botão apenas se o usuário tiver as permissões necessárias
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  children,
  requiredRoles = [],
  requireOwnership = false,
  resourceOwnerId,
  permission,
  farmId,
  fallback = null,
  disableInsteadOfHide = false,
  buttonProps = {},
  className = ''
}) => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const permissions = usePermissions();

  // Verifica se está autenticado
  if (!isAuthenticated) {
    return disableInsteadOfHide ? (
      <button {...buttonProps} disabled className={`${className} opacity-50 cursor-not-allowed`}>
        {children}
      </button>
    ) : (fallback as React.ReactElement);
  }

  let hasPermission = true;

  // Verifica roles necessárias
  if (requiredRoles.length > 0) {
    const userRoles = tokenPayload?.authorities ?? [];
    hasPermission = requiredRoles.some(role => userRoles.includes(role));
  }

  // Verifica ownership se necessário
  if (hasPermission && requireOwnership && resourceOwnerId && tokenPayload?.userId) {
    const isOwner = permissions.isOwner(resourceOwnerId);
    const isAdmin = permissions.isAdmin;
    hasPermission = isOwner || isAdmin;
  }

  // Verifica permissão específica se fornecida
  if (hasPermission && permission && tokenPayload) {
    const userRole = tokenPayload.authorities[0] || RoleEnum.ROLE_PUBLIC;
    const userId = tokenPayload.userId;

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
  }

  // Se não tem permissão
  if (!hasPermission) {
    if (disableInsteadOfHide) {
      return (
        <button 
          {...buttonProps} 
          disabled 
          className={`${className} opacity-50 cursor-not-allowed`}
          title="Você não tem permissão para esta ação"
        >
          {children}
        </button>
      );
    }
    return fallback as React.ReactElement;
  }

  // Renderiza o botão com permissão
  return (
    <button {...buttonProps} className={className}>
      {children}
    </button>
  );
};

export default PermissionButton;