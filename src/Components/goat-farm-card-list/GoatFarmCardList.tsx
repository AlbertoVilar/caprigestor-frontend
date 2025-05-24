import type { GoatFarmDTO } from "../../Models/goatFarm";
import GoatFarmCard from "../goatfarms-cards/GoatfarmCard";


interface Props {
  farms: GoatFarmDTO[];
}

export default function GoatFarmCardList({ farms }: Props) {
  return (
    <div className="goatfarm-list">
      {farms.map((farm) => (
        <GoatFarmCard key={farm.id} farm={farm} />
      ))}
    </div>
  );
}
