// src/hooks/usePermissions.ts
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { GoatFarmResponse } from '../Models/GoatFarmResponseDTO';
import type { GoatResponseDTO } from '../Models/goatResponseDTO';

export const usePermissions = () => {
  const { tokenPayload, isAuthenticated } = useAuth();

  // Verificações básicas de role
  const isAdmin = (): boolean => {
    return tokenPayload?.authorities?.includes('ROLE_ADMIN') || false;
  };

  const isFarmOwner = (): boolean => {
    return tokenPayload?.authorities?.includes('ROLE_FARM_OWNER') || false;
  };

  const isOperator = (): boolean => {
    return tokenPayload?.authorities?.includes('ROLE_OPERATOR') || false;
  };

  const isAuthenticatedUser = (): boolean => {
    return isAuthenticated && !!tokenPayload;
  };

  // Verificações de permissões específicas
  const canEditFarm = useCallback((farm: GoatFarmResponse): boolean => {
    if (!tokenPayload) return false;
    if (isAdmin()) return true;
    if (isOperator() || isFarmOwner()) {
      const resourceOwnerId = farm.userId ?? farm.ownerId;
      return resourceOwnerId != null && Number(resourceOwnerId) === Number(tokenPayload.userId);
    }
    return false;
  }, [tokenPayload]);

  const canEditGoat = useCallback((goat: GoatResponseDTO): boolean => {
    if (!tokenPayload) return false;
    if (isAdmin()) return true;
    if (isOperator() || isFarmOwner()) {
      return (
        (goat.userId != null && Number(goat.userId) === Number(tokenPayload.userId)) ||
        (goat.ownerId != null && Number(goat.ownerId) === Number(tokenPayload.userId))
      );
    }
    return false;
  }, [tokenPayload]);

  const canDeleteGoat = canEditGoat;
  const canDeleteFarm = canEditFarm;

  const canCreateFarm = (): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator() || isFarmOwner());
  };

  const canAccessAdmin = (): boolean => {
    return isAdmin();
  };

  const canManageUsers = (): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator() || isFarmOwner());
  };

  const canAccessReports = (): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator() || isFarmOwner());
  };

  const isOwner = (resourceOwnerId: number): boolean => {
    if (!tokenPayload) return false;
    return Number(tokenPayload.userId) === Number(resourceOwnerId);
  };

  const canDeleteUser = (targetUserId: number): boolean => {
    if (!isAdmin()) return false;
    return targetUserId !== tokenPayload?.userId; // Admin não pode deletar a si mesmo
  };

  return {
    // Verificações de role
    isAdmin,
    isOperator,
    isFarmOwner,
    isAuthenticated: isAuthenticatedUser,
    isOwner,
    
    // Verificações de permissões
    canEditFarm,
    canDeleteFarm,
    canEditGoat,
    canDeleteGoat,
    canCreateFarm,
    canAccessAdmin,
    canManageUsers,
    canAccessReports,
    canDeleteUser,
  };
};

/**
 * Exemplo de Payload de Autorização (JWT Decode)
 * 
 * {
 *   "sub": "usuario@email.com",
 *   "userId": 123,
 *   "authorities": ["ROLE_FARM_OWNER"], // ou ["ROLE_ADMIN"], ["ROLE_OPERATOR"]
 *   "iat": 1700000000,
 *   "exp": 1700003600
 * }
 * 
 * Regras de Permissão:
 * - ROLE_ADMIN: Acesso total
 * - ROLE_FARM_OWNER / ROLE_OPERATOR: 
 *   - Criar/Editar/Excluir Cabras: Permitido APENAS se for o dono da fazenda (farm.userId === token.userId)
 *   - Criar Fazenda: Permitido
 */
