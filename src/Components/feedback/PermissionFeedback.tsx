import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../Hooks/usePermissions';
import { RoleEnum } from '../../Models/auth';

export interface PermissionStatusProps {
  /** Se true, mostra informações detalhadas */
  detailed?: boolean;
  /** Classe CSS customizada */
  className?: string;
  /** Se true, mostra apenas quando há problemas de permissão */
  onlyOnIssues?: boolean;
}

/**
 * Componente que mostra o status atual das permissões do usuário
 */
export const PermissionStatus: React.FC<PermissionStatusProps> = ({
  detailed = false,
  className = '',
  onlyOnIssues = false
}) => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const permissions = usePermissions();

  // Se não está autenticado e só mostra em caso de problemas, não renderiza
  if (!isAuthenticated && onlyOnIssues) {
    return null;
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, { label: string; color: string; icon: string }> = {
      [RoleEnum.ROLE_ADMIN]: { label: 'Administrador', color: '#e74c3c', icon: '👑' },
      [RoleEnum.ROLE_FARM_OWNER]: { label: 'Proprietário', color: '#27ae60', icon: '🏡' },
      [RoleEnum.ROLE_OPERATOR]: { label: 'Operador', color: '#3498db', icon: '⚙️' },
      [RoleEnum.ROLE_PUBLIC]: { label: 'Público', color: '#95a5a6', icon: '👤' }
    };
    return roleMap[role] || { label: role, color: '#95a5a6', icon: '❓' };
  };

  if (!isAuthenticated) {
    return (
      <div className={`permission-status not-authenticated ${className}`}>
        <div className="status-header">
          <span className="status-icon">🔓</span>
          <span className="status-text">Não Autenticado</span>
        </div>
        {detailed && (
          <div className="status-details">
            <p>Você precisa fazer login para acessar recursos protegidos.</p>
          </div>
        )}
      </div>
    );
  }

  const userRoles = tokenPayload?.authorities || [];
  return (
    <div className={`permission-status authenticated ${className}`}>
      <div className="status-header">
        <span className="status-icon">🔐</span>
        <span className="status-text">Autenticado</span>
        <span className="user-id">{tokenPayload?.sub}</span>
      </div>

      <div className="roles-section">
        <h4>Perfis Ativos:</h4>
        <div className="roles-list">
          {userRoles.map(role => {
            const roleInfo = getRoleDisplay(role);
            return (
              <div key={role} className="role-badge" style={{ borderColor: roleInfo.color }}>
                <span className="role-icon">{roleInfo.icon}</span>
                <span className="role-label">{roleInfo.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {detailed && (
        <div className="permissions-section">
          <h4>Permissões Ativas:</h4>
          <div className="permissions-grid">
            <div className="permission-item">
              <span className="permission-label">Criar Fazenda:</span>
              <span className={`permission-value ${permissions.canCreateFarm() ? 'allowed' : 'denied'}`}>
                {permissions.canCreateFarm() ? '✅' : '❌'}
              </span>
            </div>
            <div className="permission-item">
              <span className="permission-label">Editar Fazenda:</span>
              <span className={`permission-value ${(permissions.isAdmin() || permissions.isOperator()) ? 'allowed' : 'denied'}`}>
                {(permissions.isAdmin() || permissions.isOperator()) ? '✅' : '❌'}
              </span>
            </div>
            <div className="permission-item">
              <span className="permission-label">Gerenciar Usuários:</span>
              <span className={`permission-value ${permissions.canManageUsers() ? 'allowed' : 'denied'}`}>
                {permissions.canManageUsers() ? '✅' : '❌'}
              </span>
            </div>
            <div className="permission-item">
              <span className="permission-label">Acessar Relatórios:</span>
              <span className={`permission-value ${permissions.canAccessReports() ? 'allowed' : 'denied'}`}>
                {permissions.canAccessReports() ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface PermissionTooltipProps {
  /** Permissão necessária */
  permission?: string;
  /** Roles necessárias */
  requiredRoles?: RoleEnum[];
  /** Se requer autenticação */
  requireAuth?: boolean;
  /** Função customizada de verificação */
  customCheck?: () => boolean;
  /** Conteúdo do tooltip */
  children: React.ReactNode;
  /** Posição do tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Componente que mostra tooltip com informações de permissão
 */
export const PermissionTooltip: React.FC<PermissionTooltipProps> = ({
  permission,
  requiredRoles,
  requireAuth,
  customCheck,
  children,
  position = 'top'
}) => {
  const { isAuthenticated, tokenPayload } = useAuth();

  const getPermissionStatus = () => {
    if (requireAuth && !isAuthenticated) {
      return { allowed: false, reason: 'Requer autenticação' };
    }

    if (customCheck) {
      const result = customCheck();
      return { allowed: result, reason: result ? 'Permitido' : 'Acesso negado pela verificação customizada' };
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = tokenPayload?.authorities || [];
      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRole) {
        return { 
          allowed: false, 
          reason: `Requer uma das roles: ${requiredRoles.join(', ')}` 
        };
      }
    }

    if (permission) {
      // Aqui você pode implementar verificações específicas de permissão
      return { allowed: true, reason: `Permissão ${permission} verificada` };
    }

    return { allowed: true, reason: 'Acesso permitido' };
  };

  const status = getPermissionStatus();

  return (
    <div className="permission-tooltip-container">
      {children}
      <div className={`permission-tooltip ${position} ${status.allowed ? 'allowed' : 'denied'}`}>
        <div className="tooltip-content">
          <div className="tooltip-status">
            <span className="status-icon">{status.allowed ? '✅' : '❌'}</span>
            <span className="status-text">{status.allowed ? 'Permitido' : 'Negado'}</span>
          </div>
          <div className="tooltip-reason">{status.reason}</div>
          {!isAuthenticated && (
            <div className="tooltip-action">
              <small>Faça login para acessar</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface PermissionBadgeProps {
  /** Tipo de badge */
  type: 'role' | 'permission' | 'status';
  /** Valor a ser exibido */
  value: string;
  /** Se true, mostra como ativo */
  active?: boolean;
  /** Classe CSS customizada */
  className?: string;
  /** Callback ao clicar */
  onClick?: () => void;
}

/**
 * Badge para mostrar informações de permissão
 */
export const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  type,
  value,
  active = false,
  className = '',
  onClick
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'role':
        return {
          icon: '👤',
          colorClass: 'role-badge',
          prefix: 'Role:'
        };
      case 'permission':
        return {
          icon: '🔑',
          colorClass: 'permission-badge',
          prefix: 'Perm:'
        };
      case 'status':
        return {
          icon: active ? '✅' : '❌',
          colorClass: active ? 'status-active' : 'status-inactive',
          prefix: 'Status:'
        };
      default:
        return {
          icon: '❓',
          colorClass: 'default-badge',
          prefix: ''
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div 
      className={`permission-badge ${config.colorClass} ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-content">
        {config.prefix && <span className="badge-prefix">{config.prefix}</span>}
        <span className="badge-value">{value}</span>
      </span>
    </div>
  );
};

/**
 * Hook para obter informações de feedback de permissões
 */
export const usePermissionFeedback = () => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const permissions = usePermissions();

  const getAccessLevel = () => {
    if (!isAuthenticated) return 'guest';
    if (permissions.isAdmin()) return 'admin';
    if (permissions.isOperator()) return 'operator';
    return 'user';
  };

  const getAccessLevelDisplay = () => {
    const level = getAccessLevel();
    const levelMap: Record<string, { label: string; color: string; icon: string }> = {
      guest: { label: 'Visitante', color: '#95a5a6', icon: '👤' },
      user: { label: 'Usuário', color: '#3498db', icon: '👤' },
      operator: { label: 'Operador', color: '#f39c12', icon: '⚙️' },
      owner: { label: 'Proprietário', color: '#27ae60', icon: '🏡' },
      admin: { label: 'Administrador', color: '#e74c3c', icon: '👑' }
    };
    return levelMap[level];
  };

  const canAccess = (requiredLevel: string) => {
    const levels = ['guest', 'user', 'operator', 'owner', 'admin'];
    const currentLevel = getAccessLevel();
    const currentIndex = levels.indexOf(currentLevel);
    const requiredIndex = levels.indexOf(requiredLevel);
    return currentIndex >= requiredIndex;
  };

  return {
    isAuthenticated,
    accessLevel: getAccessLevel(),
    accessLevelDisplay: getAccessLevelDisplay(),
    userRoles: tokenPayload?.authorities || [],
    permissions,
    canAccess
  };
};

export default PermissionStatus;
