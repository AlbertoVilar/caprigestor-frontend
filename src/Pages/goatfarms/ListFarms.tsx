import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getAllFarmsPaginated } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";

import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatFarmCardList from "../../Components/goat-farm-card-list/GoatFarmCardList";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import { EmptyState, ErrorState, LoadingState } from "../../Components/ui";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";

import "../../index.css";
import "./listfarms.css";

export default function ListFarms() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<GoatFarmDTO[]>([]);
  const [, setSearchTerm] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tokenPayload } = useAuth();
  const permissions = usePermissions();

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    void loadFarmsPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFarmsPage(pageToLoad: number) {
    if (pageToLoad === 0) {
      setLoadingInitial(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await getAllFarmsPaginated(pageToLoad, PAGE_SIZE);
      let nextFarms = data.content;

      if (!permissions.isAdmin() && tokenPayload?.userId) {
        nextFarms = nextFarms.filter((farm) => farm.userId === tokenPayload.userId);
      }

      if (pageToLoad === 0) {
        setFarms(nextFarms);
        setFilteredFarms(nextFarms);
      } else {
        setFarms((prev) => [...prev, ...nextFarms]);
        setFilteredFarms((prev) => [...prev, ...nextFarms]);
      }

      setPage(data.page.number);
      setHasMore(data.page.number + 1 < data.page.totalPages);
    } catch (errorResponse) {
      const message = getApiErrorMessage(parseApiError(errorResponse));

      if (pageToLoad === 0) {
        setError(message);
        setFarms([]);
        setFilteredFarms([]);
        setHasMore(false);
      } else {
        toast.error(message);
      }
    } finally {
      if (pageToLoad === 0) {
        setLoadingInitial(false);
      } else {
        setLoadingMore(false);
      }
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    const trimmedTerm = term.trim().toLowerCase();
    if (!trimmedTerm) {
      setFilteredFarms(farms);
      return;
    }

    const filtered = farms.filter((farm) => farm.name.toLowerCase().includes(trimmedTerm));
    setFilteredFarms(filtered);
  };

  const handleSeeMore = () => {
    void loadFarmsPage(page + 1);
  };

  const showEmptyState = !loadingInitial && !error && filteredFarms.length === 0;
  const visibleCount = filteredFarms.length;
  const resultsLabel =
    visibleCount === 1 ? "1 fazenda disponível" : `${visibleCount} fazendas disponíveis`;
  const helperLabel =
    visibleCount !== farms.length
      ? `Mostrando ${visibleCount} de ${farms.length} fazendas carregadas.`
      : "Abra uma fazenda para acompanhar rebanho, permissões e indicadores.";

  return (
    <div className="gf-container">
      <div className="list-farms-container">
        <section className="list-farms-hero" aria-label="Catálogo de fazendas">
          <div className="list-farms-hero__copy">
            <span className="list-farms-hero__eyebrow">Catálogo de fazendas</span>
            <h1 className="list-farms-hero__title">Fazendas</h1>
            <p className="list-farms-hero__description">
              Visualize, pesquise e acompanhe as fazendas disponíveis para gestão.
            </p>
          </div>

          <div className="list-farms-hero__search">
            <SearchInputBox onSearch={handleSearch} placeholder="Buscar fazenda por nome..." />

            {!loadingInitial && !error && visibleCount > 0 && (
              <div className="list-farms-hero__meta">
                <strong>{resultsLabel}</strong>
                <span>{helperLabel}</span>
              </div>
            )}
          </div>
        </section>

        {loadingInitial ? (
          <LoadingState label="Carregando suas fazendas..." />
        ) : error ? (
          <ErrorState
            title="Não foi possível carregar as fazendas"
            description={error}
            onRetry={() => void loadFarmsPage(0)}
          />
        ) : showEmptyState ? (
          <EmptyState
            title={farms.length === 0 ? "Nenhuma fazenda cadastrada" : "Nenhuma fazenda encontrada"}
            description={
              farms.length === 0
                ? "Cadastre a primeira fazenda para começar a organizar o rebanho."
                : "Ajuste a busca para localizar uma fazenda existente."
            }
            actionLabel={farms.length === 0 ? "Cadastrar fazenda" : undefined}
            onAction={farms.length === 0 ? () => navigate("/registro") : undefined}
          />
        ) : (
          <div className="list-farms-results">
            <GoatFarmCardList farms={filteredFarms} />

            {hasMore && (
              <ButtonSeeMore onClick={handleSeeMore} loading={loadingMore} disabled={loadingMore} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
