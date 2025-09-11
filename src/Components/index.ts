// Componentes RBAC
export * from './rbac/ProtectedRoute';
export * from './rbac/PermissionButton';
export * from './rbac/PermissionWrapper';
export * from './rbac/guards';
export * from './rbac/index';

// Componentes de Feedback
export * from './feedback/PermissionFeedback';

// Componentes de Erro
export * from './error/ErrorBoundary';

// Componentes de Navegação
export * from './navigation/PermissionNavigation';

// Componentes de Farm
export * from './farm/FarmCard';

// Componentes de Rota Privada (compatibilidade)
export * from './private_route/PrivateRoute';

// Tipos e Utilitários
export type {
  PermissionType,
  OperatorType,
  RBACProps,
  OwnershipCheckProps
} from './rbac/index';

export type {
  PermissionStatusProps,
  PermissionTooltipProps,
  PermissionBadgeProps
} from './feedback/PermissionFeedback';

export type {
  ErrorBoundaryProps,
  ErrorBoundaryState
} from './error/ErrorBoundary';

export type {
  NavigationItem,
  PermissionNavigationProps
} from './navigation/PermissionNavigation';

export type {
  Farm,
  FarmCardProps,
  FarmListProps
} from './farm/FarmCard';