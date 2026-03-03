import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Alert, EmptyState, ErrorState, LoadingState } from "../../Components/ui";

import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import GoatCreateModal from "../../Components/goat-create-form/GoatCreateModal";
import GoatDashboardSummary from "../../Components/dash-animal-info/GoatDashboardSummary";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import PageHeader from "../../Components/pages-headers/PageHeader";
import SearchInputBox from "../../Components/searchs/SearchInputBox";

import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

import { findGoatsByFarmAndName, findGoatsByFarmIdPaginated } from "../../api/GoatAPI/goat";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";

import "../../index.css";
import "./goatList.css";

export default function GoatListPage() {
  const [searchParams] = useSearchParams();
  const farmId = searchParams.get("farmId");

  const { isAuthenticated, tokenPayload } = useAuth();

  const [filteredGoats, setFilteredGoats] = useState<GoatResponseDTO[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState<GoatResponseDTO | null>(null);
  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [loadingGoats, setLoadingGoats] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [goatLoadError, setGoatLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  const permissions = usePermissions();
  const isAdmin = permissions.isAdmin();
  const isOperator = permissions.isOperator();
  const isFarmOwnerRole = permissions.isFarmOwner();

  const isOwner =
    farmData &&
    tokenPayload?.userId != null &&
    (Number(tokenPayload.userId) === Number(farmData.userId) ||
      (farmData.ownerId != null && Number(tokenPayload.userId) === Number(farmData.ownerId)));

  const canCreate =
    !!farmData &&
    isAuthenticated &&
    (isAdmin || ((isOperator || isFarmOwnerRole) && isOwner));

  useEffect(() => {
    if (!farmId) return;

    setPage(0);
    setHasMore(true);
    void loadGoatsPage(0);
    void fetchFarmData(Number(farmId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  async function fetchFarmData(id: number) {
    try {
      const data = await getGoatFarmById(id);
      setFarmData(data);
    } catch (error) {
      console.error("Erro ao buscar dados do capril:", error);
      setFarmData(null);
    }
  }

  async function loadGoatsPage(pageToLoad: number) {
    if (!farmId) return;

    if (pageToLoad === 0) {
      setLoadingGoats(true);
      setGoatLoadError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await findGoatsByFarmIdPaginated(Number(farmId), pageToLoad, PAGE_SIZE);

      setFilteredGoats((prev) =>
        pageToLoad === 0 ? data.content : [...prev, ...data.content]
      );
      setPage(data.number);
      setHasMore(data.number + 1 < data.totalPages);
    } catch (error) {
      const message = getApiErrorMessage(parseApiError(error));

      if (pageToLoad === 0) {
        setFilteredGoats([]);
        setHasMore(false);
        setGoatLoadError(message);
      } else {
        toast.error(message);
      }
    } finally {
      if (pageToLoad === 0) {
        setLoadingGoats(false);
      } else {
        setLoadingMore(false);
      }
    }
  }

  function reloadGoatList() {
    void loadGoatsPage(0);
  }

  async function handleSearch(term: string) {
    const trimmedTerm = term.trim();
    if (!trimmedTerm || !farmId) {
      if (farmId) {
        reloadGoatList();
      }
      return;
    }

    setLoadingGoats(true);
    setGoatLoadError(null);

    try {
      const results = await findGoatsByFarmAndName(Number(farmId), trimmedTerm);
      setFilteredGoats(results);
      setHasMore(false);
    } catch (error) {
      setFilteredGoats([]);
      setGoatLoadError(getApiErrorMessage(parseApiError(error)));
    } finally {
      setLoadingGoats(false);
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
    void loadGoatsPage(page + 1);
  }

  if (!farmId) return <Navigate to="/fazendas" replace />;

  return (
    <>
      <GoatFarmHeader
        name={farmData?.name || "Capril"}
        logoUrl={farmData?.logoUrl}
        farmId={farmData?.id}
      />

      <div className="gf-container">
        <PageHeader
          title="Lista de Cabras"
          description="Acompanhe o rebanho, pesquise por animal e mantenha o manejo desta fazenda em ordem."
          rightButton={
            canCreate
              ? {
                  label: "Cadastrar nova cabra",
                  onClick: () => {
                    if (!farmData || !farmData.tod) {
                      console.warn("Dados da fazenda incompletos:", farmData);
                      return;
                    }

                    setShowCreateModal(true);
                  },
                }
              : undefined
          }
        />

        <div className="goat-section">
          {farmData && (
            <div className="farm-context-entry">
              <div>
                <span className="farm-context-entry__eyebrow">Contexto da Fazenda</span>
                <strong className="farm-context-entry__title">Gestão da fazenda</strong>
                <p className="farm-context-entry__description">
                  Estoque, alertas e agenda ficam no dashboard da fazenda, separados
                  do cuidado individual de cada animal.
                </p>
              </div>

              <Link
                to={buildFarmDashboardPath(farmData.id)}
                className="farm-context-entry__cta"
              >
                Abrir dashboard da fazenda
              </Link>
            </div>
          )}

          {!canCreate && isAuthenticated && (
            <Alert variant="warning" title="Sem permissão para cadastrar cabras">
              Solicite acesso ao proprietário ou a um administrador.
            </Alert>
          )}

          <div className="goat-toolbar">
            <SearchInputBox
              onSearch={handleSearch}
              placeholder="Buscar por nome ou número de registro..."
            />
          </div>

          {loadingGoats ? (
            <LoadingState label="Carregando o rebanho..." />
          ) : goatLoadError ? (
            <ErrorState
              title="Não foi possível carregar as cabras"
              description={goatLoadError}
              onRetry={reloadGoatList}
            />
          ) : filteredGoats.length === 0 ? (
            <EmptyState
              title="Nenhuma cabra encontrada"
              description="Cadastre um animal ou ajuste a busca para encontrar registros desta fazenda."
              actionLabel={canCreate ? "Cadastrar nova cabra" : undefined}
              onAction={canCreate ? () => setShowCreateModal(true) : undefined}
            />
          ) : (
            <>
              <GoatDashboardSummary goats={filteredGoats} />

              <GoatCardList
                goats={filteredGoats}
                onEdit={openEditModal}
                farmOwnerId={farmData?.ownerId ?? farmData?.userId}
              />

              {hasMore && (
                <ButtonSeeMore
                  onClick={handleSeeMore}
                  loading={loadingMore}
                  disabled={loadingMore}
                />
              )}
            </>
          )}
        </div>
      </div>

      {showCreateModal && farmData && (
        <GoatCreateModal
          onClose={() => setShowCreateModal(false)}
          onGoatCreated={handleGoatCreated}
          defaultFarmId={farmData.id}
          defaultUserId={tokenPayload?.userId || 0}
          defaultTod={farmData.tod}
        />
      )}

      {editModalOpen && selectedGoat && (
        <GoatCreateModal
          mode="edit"
          initialData={selectedGoat}
          onClose={closeEditModal}
          onGoatCreated={handleGoatCreated}
        />
      )}
    </>
  );
}
