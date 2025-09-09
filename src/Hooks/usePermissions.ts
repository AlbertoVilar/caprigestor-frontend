import { useAuth } from '../contexts/AuthContext';
import { RoleEnum } from '../Models/auth';

export interface PermissionOptions {
  resourceOwnerId?: number;
  farmOwnerId?: number;
  requireOwnership?: boolean;
}

export const usePermissions = (options: PermissionOptions = {}) => {
  const { tokenPayload, isAuthenticated } = useAuth();

  const isAdmin = () => {
    return tokenPayload?.authorities?.includes(RoleEnum.ROLE_ADMIN) || false;
  };

  const isOwner = (ownerId?: number) => {
    if (!ownerId || !tokenPayload?.userId) return false;
    return tokenPayload.userId === ownerId;
  };

  const canManage = () => {
    const { resourceOwnerId, farmOwnerId, requireOwnership = false } = options;
    
    // Usuário deve estar autenticado
    if (!isAuthenticated) return false;
    
    // Admin sempre pode gerenciar
    if (isAdmin()) return true;
    
    // Se não requer propriedade, usuário logado pode gerenciar
    if (!requireOwnership && tokenPayload?.userId) return true;
    
    // Verifica propriedade do recurso específico
    if (resourceOwnerId) {
      return isOwner(resourceOwnerId);
    }
    
    // Verifica propriedade da fazenda
    if (farmOwnerId) {
      return isOwner(farmOwnerId);
    }
    
    return false;
  };

  const canCreate = () => {
    // Usuário deve estar autenticado
    if (!isAuthenticated) return false;
    
    // Admin sempre pode criar
    if (isAdmin()) return true;
    
    // Operador pode criar (tem ROLE_OPERATOR)
    if (tokenPayload?.authorities?.includes(RoleEnum.ROLE_OPERATOR)) return true;
    
    // Proprietário da fazenda pode criar
    if (options.farmOwnerId) {
      return isOwner(options.farmOwnerId);
    }
    
    return false;
  };

  const canView = () => {
    // Admin sempre pode visualizar
    if (isAdmin()) return true;
    
    // Proprietário do recurso pode visualizar
    if (options.resourceOwnerId) {
      return isOwner(options.resourceOwnerId);
    }
    
    // Usuário logado pode visualizar recursos públicos
    return isAuthenticated;
  };

  const canDelete = () => {
    // Usuário deve estar autenticado
    if (!isAuthenticated) return false;
    
    // Apenas Admin pode excluir (conforme checklist)
    return isAdmin();
  };

  return {
    isAdmin: isAdmin(),
    isOwner,
    canManage: canManage(),
    canCreate: canCreate(),
    canView: canView(),
    canDelete: canDelete(),
    userId: tokenPayload?.userId,
    userRoles: tokenPayload?.authorities || [],
    isAuthenticated
  };
};

export default usePermissions;