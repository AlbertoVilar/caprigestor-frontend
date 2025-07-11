import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatCreateModal from "../../Components/goat-create-form/GoatCreateModal";

import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { getGoatsByFarmId } from "../../api/GoatFarmAPI/goatFarm";
import { searchGoatsByNameAndFarmId } from "../../api/GoatAPI/goat";

import { convertResponseToRequest } from "../../Convertes/goats/goatConverter"; // ✅ conversor adicionado

import "../../index.css";
import "./goatList.css";

export default function GoatListPage() {
  const [goats, setGoats] = useState<GoatResponseDTO[]>([]);
  const [filteredGoats, setFilteredGoats] = useState<GoatResponseDTO[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState<GoatResponseDTO | null>(null);
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

  const reloadGoatList = () => {
    if (!farmId) return;
    getGoatsByFarmId(Number(farmId))
      .then((data) => {
        setGoats(data);
        setFilteredGoats(data);
      })
      .catch((err) => console.error("Erro ao atualizar lista:", err));
  };

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
    reloadGoatList();
  };

  const openEditModal = (goat: GoatResponseDTO) => {
    setSelectedGoat(goat);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedGoat(null);
    setEditModalOpen(false);
  };

  return (
    <>
      <PageHeader title="Lista de Cabras" />

      <div className="goat-section">
        <div className="goat-header">
          <h2>Cabras</h2>
          <button className="btn-new-goat" onClick={() => setShowCreateModal(true)}>
            Cadastrar nova cabra
          </button>
        </div>

        <SearchInputBox onSearch={handleSearch} />

        <GoatCardList goats={filteredGoats} onEdit={openEditModal} />

        <ButtonSeeMore />
      </div>

      {/* Modal de criação */}
      {showCreateModal && (
        <GoatCreateModal
          onClose={() => setShowCreateModal(false)}
          onGoatCreated={handleGoatCreated}
        />
      )}

      {/* Modal de edição */}
      {editModalOpen && selectedGoat && (
        <GoatCreateModal
          mode="edit"
          initialData={convertResponseToRequest(selectedGoat)} // ✅ conversão correta
          onClose={closeEditModal}
          onGoatCreated={handleGoatCreated}
        />
      )}
    </>
  );
}
