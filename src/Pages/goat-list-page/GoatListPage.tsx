import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatCreateModal from "../../Components/goat-creat-form/GoatCreateModal";

import type { GoatDTO } from "../../Models/goatDTO";
import { getGoatsByFarmId } from "../../api/GoatFarmAPI/goatFarm";
import { searchGoatsByNameAndFarmId } from "../../api/GoatAPI/goat";

import "../../index.css";
import "./goatList.css";

export default function GoatListPage() {
  const [goats, setGoats] = useState<GoatDTO[]>([]);
  const [filteredGoats, setFilteredGoats] = useState<GoatDTO[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchParams] = useSearchParams();

  const farmId = searchParams.get("farmId");

  useEffect(() => {
    if (farmId) {
      getGoatsByFarmId(Number(farmId))
        .then((data) => {
          setGoats(data);
          setFilteredGoats(data);
        })
        .catch((err) => console.error("Erro ao buscar cabras:", err));
    }
  }, [farmId]);

  const handleSearch = async (term: string) => {
    if (!farmId) return;

    const localMatches = goats.filter((goat) =>
      goat.name.toLowerCase().includes(term.toLowerCase())
    );

    if (localMatches.length > 0) {
      setFilteredGoats(localMatches);
    } else {
      try {
        const backendResults = await searchGoatsByNameAndFarmId(Number(farmId), term);
        setFilteredGoats(backendResults);
      } catch (err) {
        console.error("Erro ao buscar no backend:", err);
      }
    }
  };

  const handleGoatCreated = () => {
    if (farmId) {
      getGoatsByFarmId(Number(farmId))
        .then((data) => {
          setGoats(data);
          setFilteredGoats(data);
        })
        .catch((err) => console.error("Erro ao atualizar lista:", err));
    }
  };

  return (
    <>
      <PageHeader title="Lista de Cabras" />

      <div className="goat-section">
        <div className="goat-header">
          <h2>Cabras</h2>
          <button className="btn-new-goat" onClick={() => setShowModal(true)}>
            Cadastrar nova cabra
          </button>
        </div>

        <SearchInputBox onSearch={handleSearch} />

        <GoatCardList goats={filteredGoats} />

        <ButtonSeeMore />
      </div>

      {showModal && (
        <GoatCreateModal
          onClose={() => setShowModal(false)}
          onGoatCreated={handleGoatCreated}
        />
      )}
    </>
  );
}
