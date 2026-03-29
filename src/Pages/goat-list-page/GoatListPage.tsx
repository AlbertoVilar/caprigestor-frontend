import { useEffect, useState, type ChangeEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Alert, EmptyState, ErrorState, LoadingState } from "../../Components/ui";

import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatAbccImportModal from "../../Components/goat-abcc-import/GoatAbccImportModal";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import GoatCreateModal from "../../Components/goat-create-form/GoatCreateModal";
import GoatDashboardSummary from "../../Components/dash-animal-info/GoatDashboardSummary";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import PageHeader from "../../Components/pages-headers/PageHeader";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatListActions from "./GoatListActions";

import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatHerdSummaryDTO } from "../../Models/GoatHerdSummaryDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

import {
  fetchGoatById,
  fetchGoatHerdSummary,
  findGoatsByFarmAndName,
  findGoatsByFarmIdPaginated,
} from "../../api/GoatAPI/goat";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import { GoatBreedEnum, breedLabels } from "../../types/goatEnums";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";

import "../../index.css";
import "./goatList.css";

const PAGE_SIZE = 12;
const ALL_BREEDS_VALUE = "ALL";
type GoatBreedFilterValue = GoatBreedEnum | typeof ALL_BREEDS_VALUE;

const sortedBreedOptions = Object.values(GoatBreedEnum).sort((left, right) =>
  breedLabels[left].localeCompare(breedLabels[right], "pt-BR")
);

export default function GoatListPage() {
  const [searchParams] = useSearchParams();
  const farmId = searchParams.get("farmId");

  const { isAuthenticated, tokenPayload } = useAuth();

  const [filteredGoats, setFilteredGoats] = useState<GoatResponseDTO[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAbccImportModal, setShowAbccImportModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState<GoatResponseDTO | null>(null);
  const [loadingEditGoat, setLoadingEditGoat] = useState(false);
  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [loadingGoats, setLoadingGoats] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [goatLoadError, setGoatLoadError] = useState<string | null>(null);
  const [herdSummary, setHerdSummary] = useState<GoatHerdSummaryDTO | null>(null);
  const [loadingHerdSummary, setLoadingHerdSummary] = useState(true);
  const [herdSummaryError, setHerdSummaryError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBreed, setSelectedBreed] =
    useState<GoatBreedFilterValue>(ALL_BREEDS_VALUE);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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

    setSearchTerm("");
    setSelectedBreed(ALL_BREEDS_VALUE);
    setPage(0);
    setHasMore(true);
    void loadGoatsPage(0, { term: "", breed: ALL_BREEDS_VALUE });
    void loadHerdSummary(Number(farmId));
    void fetchFarmData(Number(farmId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  function toBreedParam(breedValue: GoatBreedFilterValue): string | undefined {
    return breedValue === ALL_BREEDS_VALUE ? undefined : breedValue;
  }

  async function fetchFarmData(id: number) {
    try {
      const data = await getGoatFarmById(id);
      setFarmData(data);
    } catch (error) {
      console.error("Erro ao buscar dados do capril:", error);
      setFarmData(null);
    }
  }

  async function loadGoatsPage(
    pageToLoad: number,
    filters?: { term?: string; breed?: GoatBreedFilterValue }
  ) {
    if (!farmId) return;

    const activeTerm = (filters?.term ?? searchTerm).trim();
    const activeBreed = filters?.breed ?? selectedBreed;
    const breedParam = toBreedParam(activeBreed);

    if (pageToLoad === 0) {
      setLoadingGoats(true);
      setGoatLoadError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      if (activeTerm) {
        const results = await findGoatsByFarmAndName(Number(farmId), activeTerm, breedParam);
        setFilteredGoats(results);
        setPage(0);
        setHasMore(false);
        return;
      }

      const data = await findGoatsByFarmIdPaginated(
        Number(farmId),
        pageToLoad,
        PAGE_SIZE,
        breedParam
      );

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

  async function loadHerdSummary(id: number) {
    setLoadingHerdSummary(true);
    setHerdSummaryError(null);

    try {
      const data = await fetchGoatHerdSummary(id);
      setHerdSummary(data);
    } catch (error) {
      setHerdSummary(null);
      setHerdSummaryError(getApiErrorMessage(parseApiError(error)));
    } finally {
      setLoadingHerdSummary(false);
    }
  }

  function reloadGoatList() {
    void loadGoatsPage(0);
  }

  function reloadGoatListAndSummary() {
    if (!farmId) return;

    void loadGoatsPage(0);
    void loadHerdSummary(Number(farmId));
  }

  function handleSearch(term: string) {
    const trimmedTerm = term.trim();
    setSearchTerm(trimmedTerm);
    setPage(0);
    setHasMore(true);
    void loadGoatsPage(0, { term: trimmedTerm, breed: selectedBreed });
  }

  function handleBreedChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextBreed = event.target.value as GoatBreedFilterValue;
    setSelectedBreed(nextBreed);
    setPage(0);
    setHasMore(true);
    void loadGoatsPage(0, { term: searchTerm, breed: nextBreed });
  }

  function handleGoatCreated() {
    reloadGoatListAndSummary();
  }

  function handleOpenCreateModal() {
    if (!farmData || !farmData.tod) {
      console.warn("Dados da fazenda incompletos:", farmData);
      return;
    }

    setShowCreateModal(true);
  }

  async function openEditModal(goat: GoatResponseDTO) {
    if (!farmId) return;

    setEditModalOpen(true);
    setLoadingEditGoat(true);
    setSelectedGoat(null);

    try {
      const goatIdentifier = goat.registrationNumber?.trim() || goat.id;

      if (!goatIdentifier) {
        throw new Error("Cabra selecionada sem identificador válido para edição.");
      }

      const detailedGoat = await fetchGoatById(Number(farmId), goatIdentifier);

      setSelectedGoat(detailedGoat);
    } catch (error) {
      setEditModalOpen(false);
      setSelectedGoat(null);
      toast.error(getApiErrorMessage(parseApiError(error)));
    } finally {
      setLoadingEditGoat(false);
    }
  }

  function closeEditModal() {
    setSelectedGoat(null);
    setEditModalOpen(false);
    setLoadingEditGoat(false);
  }

  function handleSeeMore() {
    void loadGoatsPage(page + 1);
  }

  if (!farmId) return <Navigate to="/fazendas" replace />;

  const selectedBreedLabel =
    selectedBreed === ALL_BREEDS_VALUE ? "Todas as raças" : breedLabels[selectedBreed];
  const workspaceSummaryLabel = loadingGoats
    ? "Carregando visão do rebanho"
    : `${filteredGoats.length} animal${filteredGoats.length === 1 ? "" : "is"} em foco`;

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
          actions={
            <GoatListActions
              canCreate={canCreate}
              onCreateManual={handleOpenCreateModal}
              onImportAbcc={() => setShowAbccImportModal(true)}
            />
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

          <section className="goat-workspace-shell" aria-label="Resumo da área do rebanho">
            <div className="goat-workspace-shell__header">
              <div>
                <span className="goat-workspace-shell__eyebrow">Área operacional</span>
                <h2>Rebanho da fazenda</h2>
              </div>
              <span className="goat-workspace-shell__count">{workspaceSummaryLabel}</span>
            </div>

            <div className="goat-workspace-shell__signals">
              <div className="goat-workspace-shell__signal">
                <strong>{searchTerm ? `Busca: "${searchTerm}"` : "Visão geral"}</strong>
                <span>Você está filtrando o rebanho sem sair do contexto desta fazenda.</span>
              </div>
              <div className="goat-workspace-shell__signal">
                <strong>{selectedBreedLabel}</strong>
                <span>Filtro atual de raça aplicado na listagem.</span>
              </div>
            </div>
          </section>

          {!canCreate && isAuthenticated && (
            <Alert variant="warning" title="Sem permissão para cadastrar cabras">
              Solicite acesso ao proprietário ou a um administrador.
            </Alert>
          )}

          <div className="goat-toolbar-shell">
            <div className="goat-toolbar-shell__header">
              <div>
                <span className="goat-toolbar-shell__eyebrow">Busca e filtro</span>
                <h3>Encontre rapidamente o animal certo</h3>
              </div>
              <p>
                A busca por nome ou registro e o filtro por raça ficam lado a lado para reduzir atrito
                no uso diário.
              </p>
            </div>

            <div className="goat-toolbar">
              <div className="goat-toolbar__search">
                <SearchInputBox
                  onSearch={handleSearch}
                  placeholder="Buscar por nome ou número de registro..."
                />
              </div>
              <div className="goat-toolbar__filter">
                <label htmlFor="goat-breed-filter" className="goat-toolbar__filter-label">
                  Filtrar por raça
                </label>
                <select
                  id="goat-breed-filter"
                  value={selectedBreed}
                  onChange={handleBreedChange}
                  className="goat-toolbar__filter-select"
                >
                  <option value={ALL_BREEDS_VALUE}>Todas</option>
                  {sortedBreedOptions.map((breed) => (
                    <option key={breed} value={breed}>
                      {breedLabels[breed]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingGoats ? (
            <LoadingState label="Carregando o rebanho..." />
          ) : goatLoadError ? (
            <ErrorState
              title="Não foi possível carregar as cabras"
              description={goatLoadError}
              onRetry={reloadGoatList}
            />
          ) : (
            <>
              <GoatDashboardSummary
                summary={herdSummary}
                visibleCount={filteredGoats.length}
                loading={loadingHerdSummary}
                error={herdSummaryError}
                onRetry={farmId ? () => void loadHerdSummary(Number(farmId)) : undefined}
              />

              {filteredGoats.length === 0 ? (
                <EmptyState
                  title="Nenhuma cabra encontrada"
                  description="Cadastre um animal ou ajuste a busca para encontrar registros desta fazenda."
                  actionLabel={canCreate ? "Cadastrar nova cabra" : undefined}
                  onAction={canCreate ? handleOpenCreateModal : undefined}
                />
              ) : (
                <>
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

      {showAbccImportModal && farmData && (
        <GoatAbccImportModal
          isOpen={showAbccImportModal}
          farmId={farmData.id}
          defaultTod={farmData.tod}
          onClose={() => setShowAbccImportModal(false)}
          onImported={handleGoatCreated}
        />
      )}

      {editModalOpen && (
        <GoatCreateModal
          mode="edit"
          initialData={selectedGoat}
          loading={loadingEditGoat}
          defaultTod={farmData?.tod}
          onClose={closeEditModal}
          onGoatCreated={handleGoatCreated}
        />
      )}
    </>
  );
}
