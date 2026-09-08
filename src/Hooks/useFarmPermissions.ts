import { useEffect, useState } from "react";
import { getFarmPermissions } from "../api/GoatFarmAPI/goatFarm";
import { usePermissions } from "./usePermissions";

export function useFarmPermissions(farmId?: number) {
  const permissions = usePermissions();
  const isAdmin = permissions.isAdmin();
  const isOperator = permissions.isOperator();
  const [canCreateGoat, setCanCreateGoat] = useState(false);
  const [canManageLactation, setCanManageLactation] = useState(false);
  const [canManageMilkProduction, setCanManageMilkProduction] = useState(false);
  const [canManageReproduction, setCanManageReproduction] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!farmId) {
        setCanCreateGoat(false);
        setCanManageLactation(false);
        setCanManageMilkProduction(false);
        setCanManageReproduction(false);
        return;
      }
      if (isAdmin) {
        setCanCreateGoat(true);
        setCanManageLactation(true);
        setCanManageMilkProduction(true);
        setCanManageReproduction(true);
        return;
      }
      // Operational endpoints use @CanManageFarm. A linked OPERATOR is
      // therefore allowed by the backend even though the legacy permissions
      // DTO only reports the owner/admin flag. The API remains authoritative
      // for rejecting an operator that is not linked to this farm.
      if (isOperator) {
        setCanCreateGoat(true);
        setCanManageLactation(true);
        setCanManageMilkProduction(true);
        setCanManageReproduction(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getFarmPermissions(Number(farmId));
        const canCreate = Boolean(data?.canCreateGoat);
        setCanCreateGoat(canCreate);
        setCanManageLactation(Boolean(data?.canManageLactation ?? canCreate));
        setCanManageMilkProduction(Boolean(data?.canManageMilkProduction ?? canCreate));
        setCanManageReproduction(Boolean(data?.canManageReproduction ?? canCreate));
      } catch {
        setCanCreateGoat(false);
        setCanManageLactation(false);
        setCanManageMilkProduction(false);
        setCanManageReproduction(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [farmId, isAdmin, isOperator]);

  return {
    canCreateGoat,
    canManageLactation,
    canManageMilkProduction,
    canManageReproduction,
    loading,
  };
}
