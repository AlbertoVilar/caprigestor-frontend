// src/hooks/usePermissions.ts
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { GoatFarmResponse, GoatResponse } from '../types';

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
    if (isFarmOwner() || isOperator()) {
      return farm.userId === tokenPayload.userId; // Verificação de ownership
    }
    return false;
  }, [tokenPayload]);

  const canEditGoat = useCallback((goat: GoatResponse): boolean => {
    return canEditFarm(goat.farm);
  }, [canEditFarm]);

  const canCreateFarm = (): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isFarmOwner() || isOperator());
  };

  const canAccessAdmin = (): boolean => {
    return isAdmin();
  };

  const canManageUsers = (): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isFarmOwner() || isOperator());
  };

  const canDeleteUser = (targetUserId: number): boolean => {
    if (!isAdmin()) return false;
    return targetUserId !== tokenPayload?.userId; // Admin não pode deletar a si mesmo
  };

  return {
    // Verificações de role
    isAdmin,
    isFarmOwner, 
    isOperator,
    isAuthenticated: isAuthenticatedUser,
    
    // Verificações de permissões
    canEditFarm,
    canEditGoat,
    canCreateFarm,
    canAccessAdmin,
    canManageUsers,
    canDeleteUser,
  };
};