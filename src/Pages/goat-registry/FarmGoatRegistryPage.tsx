import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getFarmGoatRegistry } from "../../api/GoatOwnershipAPI/farmGoatRegistry";
import type { FarmGoatRegistryResponseDTO } from "../../Models/FarmGoatRegistryDTOs";
import ContextBreadcrumb from "../../Components/pages-headers/ContextBreadcrumb";
import { EmptyState, ErrorState, LoadingState } from "../../Components/ui";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import FarmGoatRegistryItemRow from "./components/FarmGoatRegistryItemRow";
import FarmAnimalViewSwitcher from "../../Components/goat-views/FarmAnimalViewSwitcher";
import "./FarmGoatRegistryPage.css";

export type RegistryViewMode = "REBANHO_ATUAL" | "CRIATORIO" | "HISTORICO";

export const VIEW_CONFIG: Record<
  RegistryViewMode,
  { label: string; predicate: (item: FarmGoatRegistryResponseDTO) => boolean }
> = {
  REBANHO_ATUAL: {
    label: "Rebanho atual",
    predicate: (item) => item.roles.includes("CURRENT_OWNER"),
  },
  CRIATORIO: {
    label: "Criatório",
    predicate: (item) => item.roles.includes("CREATOR"),
  },
  HISTORICO: {
    label: "Histórico",
    predicate: (item) =>
      item.roles.includes("CURRENT_OWNER") || item.roles.includes("FORMER_OWNER"),
  },
};

export default function FarmGoatRegistryPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const farmIdNumber = Number(farmId);
  const isValidFarmId = Number.isSafeInteger(farmIdNumber) && farmIdNumber > 0;

  const [activeView, setActiveView] = useState<RegistryViewMode>("REBANHO_ATUAL");
  const [searchTerm, setSearchTerm] = useState("");
  const [registryItems, setRegistryItems] = useState<FarmGoatRegistryResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const loadRegistry = useCallback(async () => {
    if (!isValidFarmId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getFarmGoatRegistry(farmIdNumber);
      setRegistryItems(data ?? []);
    } catch (err) {
      setError(err);
      setRegistryItems([]);
    } finally {
      setLoading(false);
    }
  }, [farmIdNumber, isValidFarmId]);

  useEffect(() => {
    void loadRegistry();
  }, [loadRegistry]);

  // Filter by view, deduplicate by goatId (first occurrence wins), and apply search
  const visibleItems = useMemo(() => {
    const { predicate } = VIEW_CONFIG[activeView];
    const seenIds = new Set<number>();
    const deduplicated: FarmGoatRegistryResponseDTO[] = [];

    for (const item of registryItems) {
      if (predicate(item) && !seenIds.has(item.goatId)) {
        seenIds.add(item.goatId);
        deduplicated.push(item);
      }
    }

    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (!trimmedSearch) {
      return deduplicated;
    }

    return deduplicated.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(trimmedSearch)) ||
        (item.registrationNumber &&
          item.registrationNumber.toLowerCase().includes(trimmedSearch))
    );
  }, [activeView, registryItems, searchTerm]);

  if (!isValidFarmId) {
    return (
      <main className="farm-goat-registry-page">
        <ErrorState
          title="Identificador inválido"
          description="O identificador da fazenda informado na rota é inválido."
        />
      </main>
    );
  }

  const errorStatus = (() => {
    if (typeof error !== "object" || error === null) return undefined;
    const candidate = error as { response?: { status?: unknown }; status?: unknown };
    if (typeof candidate.response?.status === "number") return candidate.response.status;
    if (typeof candidate.status === "number") return candidate.status;
    return undefined;
  })();

  const isForbidden = errorStatus === 403;

  return (
    <main className="farm-goat-registry-page">
      <ContextBreadcrumb
        items={[
          { label: "Fazendas", to: "/goatfarms" },
          {
            label: `Fazenda #${farmIdNumber}`,
            to: buildFarmDashboardPath(farmIdNumber),
          },
          { label: "Registro de Animais" },
        ]}
      />

      <header className="farm-goat-registry-header">
        <h1 className="farm-goat-registry-title">Livro de Registro de Animais</h1>
        <p className="farm-goat-registry-description">
          Consulte os animais com vínculo presente ou histórico nesta fazenda.
        </p>
      </header>

      <FarmAnimalViewSwitcher farmId={farmIdNumber} />

      {loading ? (
        <LoadingState label="Carregando livro de registro da fazenda..." />
      ) : error ? (
        <ErrorState
          title={isForbidden ? "Acesso negado" : "Não foi possível carregar o livro de registro"}
          description={
            isForbidden
              ? "Você não tem permissão para consultar o livro de registro desta fazenda."
              : getApiErrorMessage(parseApiError(error))
          }
          retryLabel={isForbidden ? undefined : "Tentar novamente"}
          onRetry={isForbidden ? undefined : loadRegistry}
        />
      ) : registryItems.length === 0 ? (
        <EmptyState
          title="Nenhum registro encontrado"
          description="Nenhum animal possui vínculo registrado com esta fazenda."
        />
      ) : (
        <>
          <section className="farm-goat-registry-controls" aria-label="Filtros do livro de registro">
            <div className="farm-goat-registry-tabs" role="tablist" aria-label="Visões do livro de registro">
              {(Object.keys(VIEW_CONFIG) as RegistryViewMode[]).map((viewKey) => {
                const isActive = activeView === viewKey;
                return (
                  <button
                    key={viewKey}
                    type="button"
                    role="tab"
                    id={`tab-${viewKey}`}
                    aria-selected={isActive}
                    aria-controls="registry-table-panel"
                    className={`farm-goat-registry-tab ${isActive ? "is-active" : ""}`}
                    onClick={() => setActiveView(viewKey)}
                  >
                    {VIEW_CONFIG[viewKey].label}
                  </button>
                );
              })}
            </div>

            <div className="farm-goat-registry-search">
              <i className="fa-solid fa-magnifying-glass farm-goat-registry-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="farm-goat-registry-search-input"
                placeholder="Buscar por nome ou RG..."
                aria-label="Buscar animais por nome ou RG"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </section>

          <div className="farm-goat-registry-summary-bar">
            <span>
              Exibindo <strong>{visibleItems.length}</strong>{" "}
              {visibleItems.length === 1 ? "animal" : "animais"} em{" "}
              <strong>{VIEW_CONFIG[activeView].label}</strong>
              {searchTerm.trim() ? ` (filtrado por "${searchTerm.trim()}")` : ""}
            </span>
          </div>

          {visibleItems.length === 0 ? (
            <EmptyState
              title="Nenhum animal nesta visão"
              description={
                searchTerm.trim()
                  ? `Nenhum animal corresponde à busca "${searchTerm.trim()}" nesta visão.`
                  : `Não há animais cadastrados para a visão ${VIEW_CONFIG[activeView].label}.`
              }
            />
          ) : (
            <div
              id="registry-table-panel"
              role="tabpanel"
              aria-labelledby={`tab-${activeView}`}
              className="farm-goat-registry-table-wrapper"
            >
              <table className="farm-goat-registry-table">
                <caption className="visually-hidden">
                  Livro de registro de animais da fazenda #{farmIdNumber}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Identificação</th>
                    <th scope="col">Papéis</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Criador Registrado</th>
                    <th scope="col">Proprietário Atual</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <FarmGoatRegistryItemRow
                      key={item.goatId}
                      item={item}
                      routeFarmId={farmIdNumber}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
