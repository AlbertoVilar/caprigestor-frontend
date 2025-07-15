import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatCreateModal from "../../Components/goat-create-form/GoatCreateModal";

import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { fetchGoatByRegistrationNumber } from "../../api/GoatFarmAPI/goatFarm";
import { searchGoatsByNameAndFarmId, findGoatsByFarmIdPaginated } from "../../api/GoatAPI/goat";
import { convertResponseToRequest } from "../../Convertes/goats/goatConverter";

import "../../index.css";
import "./goatList.css";

export default function GoatListPage() {
  const [searchParams] = useSearchParams();
  const farmId = searchParams.get("farmId");

  const [goats, setGoats] = useState<GoatResponseDTO[]>([]);
  const [filteredGoats, setFilteredGoats] = useState<GoatResponseDTO[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState<GoatResponseDTO | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (farmId) loadGoatsPage(0);
  }, [farmId]);

  const loadGoatsPage = (pageToLoad: number) => {
    if (!farmId) return;

    findGoatsByFarmIdPaginated(Number(farmId), pageToLoad, PAGE_SIZE)
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
    if (!trimmedTerm || !farmId) return;

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

    const result = await searchGoatsByNameAndFarmId(Number(farmId), trimmedTerm);
    setFilteredGoats(result);
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
          <SearchInputBox
            onSearch={handleSearch}
            placeholder="🔍 Buscar por nome ou número de registro..."
          />
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
