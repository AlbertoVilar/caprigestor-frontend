import { useEffect, useState } from "react";
import { getFarmPermissions } from "../api/GoatFarmAPI/goatFarm";

export function useFarmPermissions(farmId?: number) {
  const [canOperateFarm, setCanOperateFarm] = useState(false);
  const [canAdministerFarm, setCanAdministerFarm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!farmId || !Number.isFinite(Number(farmId))) {
        setCanOperateFarm(false);
        setCanAdministerFarm(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getFarmPermissions(Number(farmId));
        if (!cancelled) {
          setCanOperateFarm(Boolean(data?.canOperateFarm));
          setCanAdministerFarm(Boolean(data?.canAdministerFarm));
        }
      } catch {
        if (!cancelled) {
          setCanOperateFarm(false);
          setCanAdministerFarm(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [farmId]);

  return {
    canOperateFarm,
    canAdministerFarm,
    // Compatibility aliases for existing screens. Their value now comes
    // exclusively from the farm-scoped backend capability response.
    canCreateGoat: canOperateFarm,
    canManageLactation: canOperateFarm,
    canManageMilkProduction: canOperateFarm,
    canManageReproduction: canOperateFarm,
    loading,
  };
}
