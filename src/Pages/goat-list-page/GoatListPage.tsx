import { useEffect, useState } from "react";
import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import { getAllGoats } from "../../api/GoatAPI/goat";
import type { GoatDTO } from "../../Models/goatDTO";

import "../../index.css";
import "./goatList.css";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";

export default function GoatListPage() {
  const [goats, setGoats] = useState<GoatDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getAllGoats()
      .then((dataResponse) => setGoats(dataResponse))
      .catch((err) => console.error("Erro ao buscar cabras:", err));
  }, []);

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
