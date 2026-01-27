import { useEffect, useState } from "react";
import { getFarmPermissions } from "../api/GoatFarmAPI/goatFarm";
import { usePermissions } from "./usePermissions";

export function useFarmPermissions(farmId?: number) {
  const permissions = usePermissions();
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
      if (permissions.isAdmin()) {
        setCanCreateGoat(true);
        setCanManageLactation(true);
        setCanManageMilkProduction(true);
        setCanManageReproduction(true);
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
      } catch (error) {
        console.error("Erro ao carregar permissoes da fazenda", error);
        setCanCreateGoat(false);
        setCanManageLactation(false);
        setCanManageMilkProduction(false);
        setCanManageReproduction(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [farmId, permissions]);

  return {
    canCreateGoat,
    canManageLactation,
    canManageMilkProduction,
    canManageReproduction,
    loading,
  };
}
