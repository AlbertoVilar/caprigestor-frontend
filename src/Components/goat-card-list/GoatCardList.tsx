// src/components/GoatCard-to-list/GoatCardList.tsx

import type { GoatDTO } from "../../Models/goatDTO";
import GoatCard from "../GoatCard-to-list/goatCard";
import "../../index.css";
import "./goatcard.css";

interface Props {
  goats: GoatDTO[];
  onEdit: (goat: GoatDTO) => void;
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
