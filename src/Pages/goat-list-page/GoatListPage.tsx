import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import type { GoatDTO } from "../../Models/goatDTO";

import "../../index.css";
import "./goatList.css";
import { getGoatsByFarmId } from "../../api/GoatFarmAPI/goatFarm";

export default function GoatListPage() {
  const [goats, setGoats] = useState<GoatDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const farmId = searchParams.get("farmId");
    if (farmId) {
      getGoatsByFarmId(Number(farmId))
        .then(setGoats)
        .catch((err) => console.error("Erro ao buscar cabras:", err));
    }
  }, [searchParams]);

  const filteredGoats = goats.filter((goat) =>
    goat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Lista de Cabras" />

      <div className="goat-section">
        <div className="goat-header">
          <h2>Cabras</h2>
          <button className="btn-new-goat">Cadastrar nova cabra</button>
        </div>

        <input
          type="text"
          className="goat-search"
          placeholder="Buscar por nome"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <GoatCardList goats={filteredGoats} />

        <ButtonSeeMore />
      </div>
    </>
  );
}
