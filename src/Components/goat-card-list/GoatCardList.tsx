// src/Components/goat-card-list/GoatCardList.tsx
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import GoatCard from "../GoatCard-to-list/goatCard";
import "./goatcard.css";

interface Props {
  goats: GoatResponseDTO[];
  onEdit: (goat: GoatResponseDTO) => void;
  farmOwnerId?: number; // Adicionar o ownerId da fazenda
}

export default function GoatCardList({ goats = [], onEdit, farmOwnerId }: Props) {
  if (!goats.length) {
    return <div className="goat-list empty">Nenhuma cabra encontrada.</div>;
  }

  return (
    <div className="goat-list">
      {goats.map((goat, idx) => (
        <GoatCard
          key={goat.registrationNumber ?? `${goat.name}-${idx}`}
          goat={goat}
          farmOwnerId={farmOwnerId}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
