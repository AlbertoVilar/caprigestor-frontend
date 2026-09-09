import React from 'react';
import { RoleEnum } from '../../Models/auth';
import { PermissionName, resolvePermission } from '../../services/permissionResolution';
import { useAuth } from '../../contexts/AuthContext';
import { useFarmPermissions } from '../../Hooks/useFarmPermissions';

export interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Roles necessárias para mostrar o botão */
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
  /** Se true, desabilita o botão ao invés de escondê-lo */
  disableInsteadOfHide?: boolean;
  /** Estilo visual (usado por CSS/classes do projeto) */
  variant?: string;
  /** Tamanho do botão (usado por CSS/classes do projeto) */
  size?: string;
  /** Mensagem de confirmação antes de executar o clique */
  confirmMessage?: string;
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
  requireAuth = true,
  customCheck,
  disableInsteadOfHide = false,
  confirmMessage,
  buttonProps = {},
  className = '',
  ...restButtonProps
}) => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const farmPermissions = useFarmPermissions(farmId);

  const mergedButtonProps = { ...restButtonProps, ...buttonProps };
  const mergedClassName = `${className} ${buttonProps.className ?? ''}`.trim();

  // Verifica se está autenticado
  if (requireAuth && !isAuthenticated) {
    return disableInsteadOfHide ? (
      <button {...mergedButtonProps} disabled className={`${mergedClassName} opacity-50 cursor-not-allowed`}>
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
  if (hasPermission && requireOwnership) {
    hasPermission = farmId != null && !farmPermissions.loading && farmPermissions.canAdministerFarm;
  }

  // Verifica permissão específica se fornecida
  if (hasPermission && permission) {
    hasPermission = resolvePermission({
      permission,
      userRole: tokenPayload?.authorities?.[0],
      userId: tokenPayload?.userId,
      resourceOwnerId,
      farmId,
      ...farmPermissions,
      farmPermissionsLoading: farmPermissions.loading,
    });
  }

  if (hasPermission && customCheck) {
    hasPermission = customCheck();
  }

  // Se não tem permissão
  if (!hasPermission) {
    if (disableInsteadOfHide) {
      return (
        <button 
          {...mergedButtonProps} 
          disabled 
          className={`${mergedClassName} opacity-50 cursor-not-allowed`}
          title="Você não tem permissão para esta ação"
        >
          {children}
        </button>
      );
    }
    return fallback as React.ReactElement;
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    mergedButtonProps.onClick?.(event);
  };

  // Renderiza o botão com permissão
  return (
    <button {...mergedButtonProps} onClick={handleClick} className={mergedClassName}>
      {children}
    </button>
  );
};

export default PermissionButton;
