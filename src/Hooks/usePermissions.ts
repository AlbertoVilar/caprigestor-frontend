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

  // Removido: isFarmOwner - role não mais utilizada no backend

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
    if (isOperator()) {
      return farm.userId === tokenPayload.userId; // Verificação de ownership
    }
    return false;
  }, [tokenPayload]);

  const canEditGoat = useCallback((goat: GoatResponseDTO): boolean => {
    if (!tokenPayload) return false;
    if (isAdmin()) return true;
    if (isOperator()) {
      return goat.userId === tokenPayload.userId || goat.ownerId === tokenPayload.userId;
    }
    return false;
  }, [tokenPayload]);

  const canCreateFarm = (): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator());
  };

  const canAccessAdmin = (): boolean => {
    return isAdmin();
  };

  const canManageUsers = (): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator());
  };

  const canAccessReports = (): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator());
  };

  const isOwner = (resourceOwnerId: number): boolean => {
    if (!tokenPayload) return false;
    return tokenPayload.userId === resourceOwnerId;
  };

  const canDeleteUser = (targetUserId: number): boolean => {
    if (!isAdmin()) return false;
    return targetUserId !== tokenPayload?.userId; // Admin não pode deletar a si mesmo
  };

  return {
    // Verificações de role
    isAdmin,
    isOperator,
    isAuthenticated: isAuthenticatedUser,
    isOwner,
    
    // Verificações de permissões
    canEditFarm,
    canEditGoat,
    canCreateFarm,
    canAccessAdmin,
    canManageUsers,
    canAccessReports,
    canDeleteUser,
  };
};
