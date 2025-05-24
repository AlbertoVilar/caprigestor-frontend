import type { GoatFarmDTO } from "../../Models/goatFarm";

interface Props {
  farms: GoatFarmDTO[];
}

export default function WelcomeSection({ farms }: Props) {
  return (
    <div>
      <h2>Capris disponíveis:</h2>
      {farms.map((farm) => (
        <div key={farm.id}>
          <h3>{farm.name}</h3>
          <p><strong>Proprietário:</strong> {farm.ownerName}</p>
        </div>
      ))}
    </div>
  );
}
