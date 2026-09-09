import { useEffect, useState } from "react";
import { getFarmPermissions } from "../api/GoatFarmAPI/goatFarm";

export function useFarmPermissions(farmId?: number) {
  const [canOperateFarm, setCanOperateFarm] = useState(false);
  const [canAdministerFarm, setCanAdministerFarm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedFarmId, setLoadedFarmId] = useState<number | undefined>();

  const normalizedFarmId =
    farmId != null && Number.isFinite(Number(farmId)) ? Number(farmId) : undefined;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (normalizedFarmId == null) {
        setLoadedFarmId(undefined);
        setCanOperateFarm(false);
        setCanAdministerFarm(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getFarmPermissions(normalizedFarmId);
        if (!cancelled) {
          setLoadedFarmId(normalizedFarmId);
          setCanOperateFarm(Boolean(data?.canOperateFarm));
          setCanAdministerFarm(Boolean(data?.canAdministerFarm));
        }
      } catch {
        if (!cancelled) {
          setLoadedFarmId(normalizedFarmId);
          setCanOperateFarm(false);
          setCanAdministerFarm(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [normalizedFarmId]);

  const isCurrentFarm = normalizedFarmId != null && loadedFarmId === normalizedFarmId;

  return {
    canOperateFarm: isCurrentFarm && canOperateFarm,
    canAdministerFarm: isCurrentFarm && canAdministerFarm,
    // Compatibility aliases for existing screens. Their value now comes
    // exclusively from the farm-scoped backend capability response.
    canCreateGoat: isCurrentFarm && canOperateFarm,
    canManageLactation: isCurrentFarm && canOperateFarm,
    canManageMilkProduction: isCurrentFarm && canOperateFarm,
    canManageReproduction: isCurrentFarm && canOperateFarm,
    loading: normalizedFarmId != null && (!isCurrentFarm || loading),
  };
}
