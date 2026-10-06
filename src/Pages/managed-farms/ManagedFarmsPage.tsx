import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManagedFarmsPaginated } from "../../api/GoatFarmAPI/goatFarm";
import type { ManagedFarmSummaryDTO } from "../../Models/ManagedFarmSummaryDTO";
import { Button } from "../../Components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../../Components/ui";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import "./ManagedFarmsPage.css";

const PAGE_SIZE = 12;

export default function ManagedFarmsPage() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState<ManagedFarmSummaryDTO[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedPage, setFailedPage] = useState<number | null>(null);

  const loadPage = useCallback(async (pageToLoad: number, queryToLoad: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getManagedFarmsPaginated(pageToLoad, PAGE_SIZE, queryToLoad);
      setFarms(result.content);
      setPage(result.page.number);
      setTotalPages(result.page.totalPages);
      setFailedPage(null);
    } catch (cause) {
      setError(getApiErrorMessage(parseApiError(cause)));
      setFarms([]);
      setFailedPage(pageToLoad);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPage(0, ""); }, [loadPage]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(0);
    void loadPage(0, value);
  };

  if (loading) return <LoadingState label="Carregando fazendas disponíveis para gestão..." />;

  return (
    <main className="managed-farms-page" aria-labelledby="managed-farms-title">
      <header className="managed-farms-page__hero">
        <span className="managed-farms-page__eyebrow">Ambiente de gestão</span>
        <h1 id="managed-farms-title">Escolha onde você vai trabalhar</h1>
        <p>Selecione uma fazenda para acessar seus dados e operações.</p>
        <label htmlFor="managed-farms-search">Buscar fazenda</label>
        <input
          id="managed-farms-search"
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Buscar por nome ou TOD"
        />
      </header>

      {error ? (
        <ErrorState
          title="Não foi possível carregar suas fazendas"
          description={error}
          onRetry={() => void loadPage(failedPage ?? page, query)}
        />
      ) : farms.length === 0 ? (
        <EmptyState
          title="Nenhuma fazenda disponível para gestão"
          description="Você ainda não possui uma fazenda atribuída para administrar."
          actionLabel="Ver fazendas públicas"
          onAction={() => navigate("/fazendas")}
        />
      ) : (
        <>
          <section className="managed-farms-page__grid" aria-label="Fazendas disponíveis para gestão">
            {farms.map((farm) => (
              <article className="managed-farm-card" key={farm.id}>
                <div className="managed-farm-card__identity">
                  {farm.logoUrl ? (
                    <img src={farm.logoUrl} alt={`Logo de ${farm.name}`} />
                  ) : (
                    <span className="managed-farm-card__placeholder" aria-hidden="true">
                      <i className="fa-solid fa-tractor" />
                    </span>
                  )}
                  <div>
                    <h2>{farm.name}</h2>
                    <p>{farm.tod ? `TOD ${farm.tod}` : "TOD não informado"}</p>
                  </div>
                </div>
                <Button onClick={() => navigate(buildFarmDashboardPath(farm.id))}>Acessar gestão</Button>
              </article>
            ))}
          </section>

          {totalPages > 1 && (
            <nav className="managed-farms-page__pagination" aria-label="Paginação das fazendas">
              <Button variant="secondary" disabled={page === 0} onClick={() => void loadPage(page - 1, query)}>Anterior</Button>
              <span>Página {page + 1} de {totalPages}</span>
              <Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => void loadPage(page + 1, query)}>Próxima</Button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
