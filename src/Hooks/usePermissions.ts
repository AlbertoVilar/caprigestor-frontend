import { useCallback } from 'react';

import { useAuth } from '../contexts/AuthContext';
import type { GoatFarmResponse } from '../Models/GoatFarmResponseDTO';
import type { GoatResponseDTO } from '../Models/goatResponseDTO';

export const usePermissions = () => {
  const { tokenPayload, isAuthenticated } = useAuth();

  const isAdmin = useCallback((): boolean => {
    return tokenPayload?.authorities?.includes('ROLE_ADMIN') || false;
  }, [tokenPayload]);

  const isFarmOwner = useCallback((): boolean => {
    return tokenPayload?.authorities?.includes('ROLE_FARM_OWNER') || false;
  }, [tokenPayload]);

  const isOperator = useCallback((): boolean => {
    return tokenPayload?.authorities?.includes('ROLE_OPERATOR') || false;
  }, [tokenPayload]);

  const isAuthenticatedUser = useCallback((): boolean => {
    return isAuthenticated && !!tokenPayload;
  }, [isAuthenticated, tokenPayload]);

  const canEditFarm = useCallback((farm: GoatFarmResponse): boolean => {
    if (!tokenPayload) return false;
    if (isAdmin()) return true;
    if (isOperator() || isFarmOwner()) {
      const resourceOwnerId = farm.userId ?? farm.ownerId;
      return resourceOwnerId != null && Number(resourceOwnerId) === Number(tokenPayload.userId);
    }
    return false;
  }, [tokenPayload, isAdmin, isOperator, isFarmOwner]);

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
  }, [tokenPayload, isAdmin, isOperator, isFarmOwner]);

  const canDeleteGoat = canEditGoat;
  const canDeleteFarm = canEditFarm;

  const canCreateFarm = useCallback((): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator() || isFarmOwner());
  }, [isAuthenticatedUser, isAdmin, isOperator, isFarmOwner]);

  const canAccessAdmin = useCallback((): boolean => {
    return isAdmin();
  }, [isAdmin]);

  const canManageUsers = useCallback((): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator() || isFarmOwner());
  }, [isAuthenticatedUser, isAdmin, isOperator, isFarmOwner]);

  const canAccessReports = useCallback((): boolean => {
    return isAuthenticatedUser() && (isAdmin() || isOperator() || isFarmOwner());
  }, [isAuthenticatedUser, isAdmin, isOperator, isFarmOwner]);

  const isOwner = useCallback((resourceOwnerId: number): boolean => {
    if (!tokenPayload) return false;
    return Number(tokenPayload.userId) === Number(resourceOwnerId);
  }, [tokenPayload]);

  const canDeleteUser = useCallback((targetUserId: number): boolean => {
    if (!isAdmin()) return false;
    return targetUserId !== tokenPayload?.userId;
  }, [isAdmin, tokenPayload]);

  return {
    isAdmin,
    isOperator,
    isFarmOwner,
    isAuthenticated: isAuthenticatedUser,
    isOwner,
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
