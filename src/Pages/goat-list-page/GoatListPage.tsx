import { useEffect, useState } from "react";

import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatCreateModal from "../../Components/goat-create-form/GoatCreateModal";

import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { getAllGoatsPaginated, fetchGoatByRegistrationNumber } from "../../api/GoatFarmAPI/goatFarm";
import { convertResponseToRequest } from "../../Convertes/goats/goatConverter";

import "../../index.css";
import "./goatList.css";

export default function GoatListPage() {
  const [goats, setGoats] = useState<GoatResponseDTO[]>([]);
  const [filteredGoats, setFilteredGoats] = useState<GoatResponseDTO[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState<GoatResponseDTO | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    loadGoatsPage(0);
  }, []);

  const loadGoatsPage = (pageToLoad: number) => {
    getAllGoatsPaginated(pageToLoad, PAGE_SIZE)
      .then((data) => {
        if (pageToLoad === 0) {
          setGoats(data.content);
        } else {
          setGoats((prev) => [...prev, ...data.content]);
        }

        setFilteredGoats((prev) =>
          pageToLoad === 0 ? data.content : [...prev, ...data.content]
        );

        setPage(data.page.number);
        setHasMore(data.page.number + 1 < data.page.totalPages);
      })
      .catch((err) => console.error("Erro ao buscar cabras:", err));
  };

  const reloadGoatList = () => {
    loadGoatsPage(0);
  };

  const handleSearch = async (term: string) => {
    const trimmedTerm = term.trim();

    if (!trimmedTerm) return;

    // 🔍 Se for número de registro, tenta buscar individualmente
    if (/^\d+$/.test(trimmedTerm)) {
      try {
        const result = await fetchGoatByRegistrationNumber(trimmedTerm);
        setFilteredGoats(result ? [result] : []);
        return;
      } catch (err) {
        console.error("Registro não encontrado:", err);
        setFilteredGoats([]);
        return;
      }
    }

    // 🔍 Caso contrário, busca por nome localmente
    const localMatches = goats.filter((goat) =>
      goat.name.toLowerCase().includes(trimmedTerm.toLowerCase())
    );

    if (localMatches.length > 0) {
      setFilteredGoats(localMatches);
    } else {
      // fallback: lista novamente a página
      loadGoatsPage(0);
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

  const handleSeeMore = () => {
    loadGoatsPage(page + 1);
  };

  return (
    <>
      <PageHeader
        title="Lista de Cabras"
        rightButton={{
          label: "Cadastrar nova cabra",
          onClick: () => setShowCreateModal(true),
        }}
      />

      <div className="goat-section">
        <div className="search-container-box">
          <SearchInputBox onSearch={handleSearch} placeholder="🔍 Buscar por nome ou número de registro..." />
        </div>

        <GoatCardList goats={filteredGoats} onEdit={openEditModal} />

        {hasMore && <ButtonSeeMore onClick={handleSeeMore} />}
      </div>

      {showCreateModal && (
        <GoatCreateModal
          onClose={() => setShowCreateModal(false)}
          onGoatCreated={handleGoatCreated}
        />
      )}

      {editModalOpen && selectedGoat && (
        <GoatCreateModal
          mode="edit"
          initialData={convertResponseToRequest(selectedGoat)}
          onClose={closeEditModal}
          onGoatCreated={handleGoatCreated}
        />
      )}
    </>
  );
}
