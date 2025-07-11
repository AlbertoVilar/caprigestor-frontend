// src/components/GoatCard-to-list/GoatCardList.tsx

import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import GoatCard from "../GoatCard-to-list/goatCard";
import "../../index.css";
import "./goatcard.css";

interface Props {
  goats: GoatResponseDTO[];
  onEdit: (goat: GoatResponseDTO) => void;
}

export default function GoatCardList({ goats, onEdit }: Props) {
  return (
    <div className="goat-list">
      {goats.map((goat) => (
        <GoatCard key={goat.registrationNumber} goat={goat} onEdit={onEdit} />
      ))}
    </div>
  );
}
