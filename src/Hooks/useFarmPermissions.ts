import { useEffect, useState } from "react";
import { getFarmPermissions } from "../api/GoatFarmAPI/goatFarm";
import { usePermissions } from "./usePermissions";

export function useFarmPermissions(farmId?: number) {
  const permissions = usePermissions();
  const [canCreateGoat, setCanCreateGoat] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!farmId) {
        setCanCreateGoat(false);
        return;
      }
      if (permissions.isAdmin()) {
        setCanCreateGoat(true);
        return;
      }
      try {
        setLoading(true);
        const data = await getFarmPermissions(Number(farmId));
        setCanCreateGoat(Boolean(data?.canCreateGoat));
      } catch (error) {
        console.error("Erro ao carregar permissoes da fazenda", error);
        setCanCreateGoat(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [farmId, permissions]);

  return { canCreateGoat, loading };
}
