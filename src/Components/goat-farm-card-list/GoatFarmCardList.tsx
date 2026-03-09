import type { GoatFarmDTO } from "../../Models/goatFarm";
import GoatFarmCard from "../goatfarms-cards/GoatfarmCard";
import { PermissionButton } from "../rbac/PermissionButton";
import { useState, useEffect } from "react";

import "./goatfarmCardList.css";

interface Props {
  farms: GoatFarmDTO[];
}

export default function GoatFarmCardList({ farms: initialFarms }: Props) {
  const [farms, setFarms] = useState<GoatFarmDTO[]>(initialFarms);

  useEffect(() => {
    setFarms(initialFarms);
  }, [initialFarms]);

  const handleFarmDeleted = (farmId: number) => {
    setFarms((prevFarms) => prevFarms.filter((farm) => farm.id !== farmId));
  };

  if (farms.length === 0) {
    return (
      <div className="goatfarm-list-empty">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <i className="fa-solid fa-warehouse"></i>
          </div>
          <h3>Nenhuma fazenda encontrada</h3>
          <p>Comece criando sua primeira fazenda para gerenciar seu rebanho.</p>
          <PermissionButton
            permission="canCreateFarm"
            onClick={() => (window.location.href = "/registro")}
            variant="primary"
          >
            Criar primeira fazenda
          </PermissionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="goatfarm-list">
      {farms.map((farm) => (
        <GoatFarmCard key={farm.id} farm={farm} onDeleted={handleFarmDeleted} />
      ))}
    </div>
  );
}
