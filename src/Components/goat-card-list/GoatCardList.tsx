import type { GoatDTO } from "../../Models/goatDTO";
import GoatCard from "../GoatCard-to-list/goatCard";
import "../../index.css";
import "./goatcard.css";

interface Props {
  goats: GoatDTO[];
}

export default function GoatCardList({ goats }: Props) {
  return (
    <div className="goat-list">
      {goats.map((goat) => (
        <GoatCard key={goat.registrationNumber} goat={goat} />
      ))}
    </div>
  );
}
