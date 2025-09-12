import type { GoatFarmDTO } from "../../Models/goatFarm";
import GoatFarmCard from "../goatfarms-cards/GoatfarmCard";
import { PermissionButton } from "../rbac/PermissionButton";

import "./goatfarmCardList.css"


interface Props {
  farms: GoatFarmDTO[];
}

export default function GoatFarmCardList({ farms }: Props) {
  if (farms.length === 0) {
    return (
      <div className="goatfarm-list-empty">
        <div className="empty-state">
          <div className="empty-icon">🏡</div>
          <h3>Nenhuma fazenda encontrada</h3>
          <p>Comece criando sua primeira fazenda para gerenciar seu rebanho.</p>
          <PermissionButton
            permission="canCreateFarm"
            onClick={() => window.location.href = '/registro'}
            variant="primary"
          >
            ➕ Criar Primeira Fazenda
          </PermissionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="goatfarm-list">
      {farms.map((farm) => (
        <GoatFarmCard key={farm.id} farm={farm} />
      ))}
    </div>
  );
}
