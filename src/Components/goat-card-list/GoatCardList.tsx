import { goatsData } from "../../Data/goatsData"; // ✅ dados mock
import type { Goat } from "../../Models/goat";         // ✅ tipo/interface


import '../../index.css';
import GoatCard from "../GoatCard-to-list/goatCard";

import './goatcard.css';

export default function GoatCardList() {
  return (
    <div className="goat-list">
      {goatsData.map((goat: Goat) => (
        <GoatCard key={goat.registrationNumber} goat={goat} />
      ))}
    </div>
  );
}

