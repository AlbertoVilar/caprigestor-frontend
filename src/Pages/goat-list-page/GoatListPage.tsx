// src/pages/goat/GoatListPage.tsx
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom"; // ✅ importa Navigate

import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatCreateModal from "../../Components/goat-create-form/GoatCreateModal";
import GoatDashboardSummary from "../../Components/dash-animal-info/GoatDashboardSummary";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";

import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatFarmResponse } from "../../Models/GoatFarmResponseDTO";

import { findGoatsByFarmIdPaginated } from "../../api/GoatAPI/goat";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { convertResponseToRequest } from "../../Convertes/goats/goatConverter";


import { BASE_URL } from "../../utils/apiConfig";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";

import "../../index.css";
import "./goatList.css";

export default function GoatListPage() {
  const { farmId } = useParams<{ farmId: string }>();

  // ✅ Hooks SEMPRE no topo (antes de qualquer return)
  const { isAuthenticated } = useAuth();

  const [filteredGoats, setFilteredGoats] = useState<GoatResponseDTO[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState<GoatResponseDTO | null>(null);
  const [farmData, setFarmData] = useState<GoatFarmResponse | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  // Lógica de permissão usando hook
  const { canCreate, isAdmin, userId } = usePermissions({ farmOwnerId: farmData?.ownerId });
  
  // Debug logs
  console.log('=== DEBUG PERMISSIONS ===');
  console.log('farmData:', farmData);
  console.log('isAuthenticated:', isAuthenticated);
  console.log('isAdmin:', isAdmin);
  console.log('canCreate:', canCreate);
  console.log('userId:', userId);
  console.log('farmData?.ownerId:', farmData?.ownerId);
  console.log('========================');

  useEffect(() => {
    if (!farmId) return;          // sem farmId, não carrega
    setPage(0);
    setHasMore(true);
    loadGoatsPage(0);
    fetchFarmData(Number(farmId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  async function fetchFarmData(id: number) {
    try {
      const data = await getGoatFarmById(id);
      setFarmData(data);
    } catch (err) {
      console.error("Erro ao buscar dados do capril:", err);
      setFarmData(null);
    }
  }

  function loadGoatsPage(pageToLoad: number) {
    if (!farmId) return;
    findGoatsByFarmIdPaginated(Number(farmId), pageToLoad, PAGE_SIZE)
      .then((data) => {
        setFilteredGoats((prev) =>
          pageToLoad === 0 ? data.content : [...prev, ...data.content]
        );
        setPage(data.page.number);
        setHasMore(data.page.number + 1 < data.page.totalPages);
      })
      .catch((err) => {
        console.error("Erro ao buscar cabras:", err);
        if (pageToLoad === 0) {
          setFilteredGoats([]);
          setHasMore(false);
        }
      });
  }

  function reloadGoatList() {
    loadGoatsPage(0);
  }

  async function handleSearch(term: string) {
    const trimmedTerm = term.trim();
    if (!trimmedTerm || !farmId) {
      // limpar busca -> volta para paginação normal
      if (farmId) loadGoatsPage(0);
      return;
    }

    const url = new URL(`${BASE_URL}/goatfarms/${farmId}/goats`);
    const isNumber = /^\d+$/.test(trimmedTerm);
    if (isNumber) url.searchParams.set("registrationNumber", trimmedTerm);
    else url.searchParams.set("name", trimmedTerm);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Erro ao buscar animal");
      const data = await res.json();
      setFilteredGoats(data.content || []);
      setHasMore(false); // ao buscar, desliga paginação até limpar
    } catch (err) {
      console.error("Erro na busca:", err);
      setFilteredGoats([]);
    }
  }

  function handleGoatCreated() {
    reloadGoatList();
  }

  function openEditModal(goat: GoatResponseDTO) {
    setSelectedGoat(goat);
    setEditModalOpen(true);
  }

  function closeEditModal() {
    setSelectedGoat(null);
    setEditModalOpen(false);
  }

  function handleSeeMore() {
    loadGoatsPage(page + 1);
  }

  // ✅ Só agora fazemos o redirecionamento (depois de declarar todos os hooks)
  if (!farmId) return <Navigate to="/fazendas" replace />;

  return (
    <>
      <GoatFarmHeader name={farmData?.name || "Capril"} />

      <PageHeader
        title="Lista de Cabras"
        rightButton={
          canCreate
            ? {
                label: "Cadastrar nova cabra",
                onClick: () => {
                  if (!farmData || !farmData.tod) {
                    console.warn("❌ Dados da fazenda incompletos:", farmData);
                    return;
                  }
                  setShowCreateModal(true);
                },
              }
            : undefined
        }
      />

      <div className="goat-section">
        <SearchInputBox
          onSearch={handleSearch}
          placeholder="🔍 Buscar por nome ou número de registro..."
        />

        <GoatDashboardSummary goats={filteredGoats} />

        <GoatCardList 
          goats={filteredGoats} 
          onEdit={openEditModal} 
          farmOwnerId={farmData?.ownerId}
        />

        {hasMore && <ButtonSeeMore onClick={handleSeeMore} />}
      </div>

      {/* Modal de criação */}
      {showCreateModal && farmData && (
        <GoatCreateModal
          onClose={() => setShowCreateModal(false)}
          onGoatCreated={handleGoatCreated}
          defaultFarmId={farmData.id}
          defaultOwnerId={farmData.ownerId}
          defaultTod={farmData.tod}
        />
      )}

      {/* Modal de edição */}
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
