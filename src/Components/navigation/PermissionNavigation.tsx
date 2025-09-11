import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionWrapper } from '../rbac/PermissionWrapper';
import { RoleEnum } from '../../Models/auth';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  /** Roles necessárias para mostrar o item */
  requiredRoles?: RoleEnum[];
  /** Permissão específica necessária */
  permission?: 'canCreateFarm' | 'canEditFarm' | 'canDeleteFarm' | 'canViewFarm' |
              'canCreateGoat' | 'canEditGoat' | 'canDeleteGoat' | 'canViewGoat' |
              'canCreateEvent' | 'canEditEvent' | 'canDeleteEvent' | 'canViewEvent' |
              'canManageUsers' | 'canAccessReports';
  /** Se true, requer autenticação */
  requireAuth?: boolean;
  /** Subitens do menu */
  children?: NavigationItem[];
  /** Se true, o item é sempre visível (público) */
  isPublic?: boolean;
}

export interface PermissionNavigationProps {
  /** Lista de itens de navegação */
  items: NavigationItem[];
  /** Classe CSS para o container */
  className?: string;
  /** Classe CSS para itens ativos */
  activeClassName?: string;
  /** Classe CSS para itens normais */
  itemClassName?: string;
  /** Renderização customizada para itens */
  renderItem?: (item: NavigationItem, isActive: boolean) => React.ReactNode;
  /** Se true, mostra apenas itens que o usuário tem permissão */
  hideUnauthorized?: boolean;
  /** Orientação do menu */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Componente de navegação que mostra itens baseado nas permissões do usuário
 */
export const PermissionNavigation: React.FC<PermissionNavigationProps> = ({
  items,
  className = '',
  activeClassName = 'active',
  itemClassName = '',
  renderItem,
  hideUnauthorized = true,
  orientation = 'vertical'
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;

    // Se é público, sempre mostra
    if (item.isPublic) {
      return (
        <div key={item.id} className={`nav-item level-${level}`}>
          {renderItem ? (
            renderItem(item, isActive)
          ) : (
            <Link 
              to={item.path}
              className={`${itemClassName} ${isActive ? activeClassName : ''}`}
            >
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              <span className="nav-label">{item.label}</span>
            </Link>
          )}
          {hasChildren && (
            <div className="nav-children">
              {item.children!.map(child => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Para itens protegidos, usa PermissionWrapper
    return (
      <PermissionWrapper
        key={item.id}
        requiredRoles={item.requiredRoles}
        permission={item.permission}
        requireAuth={item.requireAuth ?? true}
        fallback={hideUnauthorized ? null : (
          <div className={`nav-item disabled level-${level}`}>
            <span className={`${itemClassName} disabled`}>
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              <span className="nav-label">{item.label}</span>
            </span>
          </div>
        )}
      >
        <div className={`nav-item level-${level}`}>
          {renderItem ? (
            renderItem(item, isActive)
          ) : (
            <Link 
              to={item.path}
              className={`${itemClassName} ${isActive ? activeClassName : ''}`}
            >
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              <span className="nav-label">{item.label}</span>
            </Link>
          )}
          {hasChildren && (
            <div className="nav-children">
              {item.children!.map(child => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      </PermissionWrapper>
    );
  };

  return (
    <nav className={`permission-navigation ${orientation} ${className}`}>
      {items.map(item => renderNavigationItem(item))}
    </nav>
  );
};

/**
 * Configuração padrão de navegação para o sistema Capril Vilar
 */
export const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Início',
    path: '/',
    isPublic: true
  },
  {
    id: 'genealogies',
    label: 'Genealogias',
    path: '/genealogies',
    isPublic: true
  },
  {
    id: 'farms',
    label: 'Fazendas',
    path: '/farms',
    requireAuth: true,
    children: [
      {
        id: 'farms-list',
        label: 'Listar Fazendas',
        path: '/farms',
        requireAuth: true
      },
      {
        id: 'farms-create',
        label: 'Criar Fazenda',
        path: '/farms/create',
        permission: 'canCreateFarm'
      }
    ]
  },
  {
    id: 'goats',
    label: 'Cabras',
    path: '/goats',
    requireAuth: true
  },
  {
    id: 'events',
    label: 'Eventos',
    path: '/events',
    requireAuth: true
  },
  {
    id: 'admin',
    label: 'Administração',
    path: '/admin',
    requiredRoles: [RoleEnum.ROLE_ADMIN],
    children: [
      {
        id: 'admin-users',
        label: 'Gerenciar Usuários',
        path: '/admin/users',
        permission: 'canManageUsers'
      },
      {
        id: 'admin-reports',
        label: 'Relatórios',
        path: '/admin/reports',
        permission: 'canAccessReports'
      }
    ]
  }
];

/**
 * Hook para filtrar itens de navegação baseado nas permissões do usuário
 */
export const useFilteredNavigation = (items: NavigationItem[]) => {
  const { isAuthenticated, tokenPayload } = useAuth();
  const permissions = usePermissions();

  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(item => {
      // Itens públicos sempre passam
      if (item.isPublic) {
        return true;
      }

      // Se requer autenticação e não está autenticado
      if (item.requireAuth && !isAuthenticated) {
        return false;
      }

      // Verifica roles necessárias
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        const userRoles = tokenPayload?.authorities ?? [];
        const hasRequiredRole = item.requiredRoles.some(role => userRoles.includes(role));
        if (!hasRequiredRole) {
          return false;
        }
      }

      // Verifica permissão específica
      if (item.permission && tokenPayload) {
        // Aqui você pode implementar a lógica específica de verificação
        // baseada no PermissionService
        return true; // Simplificado por enquanto
      }

      return true;
    }).map(item => ({
      ...item,
      children: item.children ? filterItems(item.children) : undefined
    }));
  };

  return filterItems(items);
};

export default PermissionNavigation;