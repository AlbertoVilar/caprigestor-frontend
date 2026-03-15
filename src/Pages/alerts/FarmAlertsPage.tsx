import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { AlertItem, AlertSeverity, AlertSource } from "../../services/alerts/AlertRegistry";
import { FarmAlertsProvider, useFarmAlerts } from "../../contexts/alerts/FarmAlertsContext";
import {
  filterAndSortAlerts,
  summarizeBySeverity,
  type SeverityFilter,
  type SortMode,
  type SourceFilter
} from "../../services/alerts/farmAlertsSemantics";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import "../../index.css";
import "./FarmAlertsPage.css";

const SOURCE_LABELS: Record<AlertSource, string> = {
  reproduction: "Reprodução",
  lactation: "Lactação",
  health: "Sanidade"
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa"
};

const PROVIDER_BY_SOURCE: Record<AlertSource, string> = {
  reproduction: "reproduction_pregnancy_diagnosis",
  lactation: "lactation_drying",
  health: "health_agenda"
};

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function getSeverityIcon(severity: AlertSeverity): string {
  if (severity === "high") return "fa-solid fa-triangle-exclamation text-danger";
  if (severity === "medium") return "fa-solid fa-circle-exclamation text-warning";
  return "fa-solid fa-circle-info text-primary";
}

function normalizeSourceFromQuery(typeParam: string | null): SourceFilter {
  if (!typeParam) return "all";
  if (typeParam === "reproduction_pregnancy_diagnosis") return "reproduction";
  if (typeParam === "lactation_drying") return "lactation";
  if (typeParam === "health_agenda") return "health";
  if (typeParam === "reproduction" || typeParam === "lactation" || typeParam === "health") {
    return typeParam;
  }
  return "all";
}

export function FarmAlertsContent() {
  const { farmId } = useParams<{ farmId: string }>();
  const farmIdNumber = Number(farmId);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { providerStates, getProvider, refreshAlerts } = useFarmAlerts();

  const [allItems, setAllItems] = useState<AlertItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(
    normalizeSourceFromQuery(searchParams.get("type"))
  );
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("priority");

  useEffect(() => {
    const nextSource = normalizeSourceFromQuery(searchParams.get("type"));
    setSourceFilter(nextSource);
  }, [searchParams]);

  const loadAllItems = useCallback(async () => {
    if (!farmId || Number.isNaN(farmIdNumber)) {
      setAllItems([]);
      setListError(null);
      return;
    }

    const providers = providerStates
      .map((state) => getProvider(state.providerKey))
      .filter((provider): provider is NonNullable<ReturnType<typeof getProvider>> => Boolean(provider));

    setLoadingItems(true);
    setListError(null);

    try {
      const listResults = await Promise.allSettled(
        providers.map(async (provider) => {
          if (!provider.getList) return [] as AlertItem[];
          return provider.getList(farmIdNumber, { page: 0, size: 20 });
        })
      );

      const merged = listResults.flatMap((result) =>
        result.status === "fulfilled" ? result.value : []
      );

      setAllItems(merged);
    } catch (error) {
      console.error("Error loading consolidated alerts", error);
      setAllItems([]);
      setListError("Nao foi possivel carregar os alertas consolidados agora.");
    } finally {
      setLoadingItems(false);
    }
  }, [farmId, farmIdNumber, getProvider, providerStates]);

  useEffect(() => {
    void loadAllItems();
  }, [loadAllItems]);

  const filteredItems = useMemo(() => {
    return filterAndSortAlerts(allItems, sourceFilter, severityFilter, sortMode);
  }, [allItems, severityFilter, sortMode, sourceFilter]);

  const itemsBySeverity = useMemo(() => {
    return {
      high: filteredItems.filter((item) => item.severity === "high"),
      medium: filteredItems.filter((item) => item.severity === "medium"),
      low: filteredItems.filter((item) => item.severity === "low")
    };
  }, [filteredItems]);

  const summaryBySource = useMemo(() => {
    return {
      reproduction: providerStates.find((state) => state.providerKey === PROVIDER_BY_SOURCE.reproduction)?.summary.count ?? 0,
      lactation: providerStates.find((state) => state.providerKey === PROVIDER_BY_SOURCE.lactation)?.summary.count ?? 0,
      health: providerStates.find((state) => state.providerKey === PROVIDER_BY_SOURCE.health)?.summary.count ?? 0
    };
  }, [providerStates]);

  const summaryBySeverity = useMemo(() => {
    return summarizeBySeverity(allItems);
  }, [allItems]);

  const totalCount = summaryBySource.reproduction + summaryBySource.lactation + summaryBySource.health;

  const handleSourceFilter = (nextSource: SourceFilter) => {
    setSourceFilter(nextSource);

    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextSource === "all") {
      nextParams.delete("type");
    } else {
      nextParams.set("type", nextSource);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const openSourceDetails = (source: AlertSource) => {
    const provider = getProvider(PROVIDER_BY_SOURCE[source]);
    if (!provider) return;
    navigate(provider.getRoute(farmIdNumber));
  };

  return (
    <div className="page-container farm-alerts-page">
      <GoatFarmHeader
        name="Central de Alertas"
        farmId={farmIdNumber}
        useExternalAlertsProvider={false}
      />

      <PageHeader
        title="Alertas consolidados da fazenda"
        description="Pendencias priorizadas por reprodução, lactação e sanidade, sem misturar com a agenda temporal."
        showBackButton={true}
        backButtonUrl={buildFarmDashboardPath(farmIdNumber)}
      />

      <section className="card-container farm-alerts-summary" aria-label="Resumo de alertas">
        <article className="farm-alerts-summary__kpi">
          <span>Total em atenção</span>
          <strong>{totalCount}</strong>
          <p>Visão consolidada da fazenda.</p>
        </article>
        <article className="farm-alerts-summary__kpi">
          <span>Alta severidade</span>
          <strong>{summaryBySeverity.high}</strong>
          <p>Prioridade imediata.</p>
        </article>
        <article className="farm-alerts-summary__kpi">
          <span>Média severidade</span>
          <strong>{summaryBySeverity.medium}</strong>
          <p>Ação no curto prazo.</p>
        </article>
        <article className="farm-alerts-summary__kpi">
          <span>Baixa severidade</span>
          <strong>{summaryBySeverity.low}</strong>
          <p>Acompanhar próximos marcos.</p>
        </article>
      </section>

      <section className="card-container farm-alerts-filters" aria-label="Filtros de alertas">
        <div className="farm-alerts-filter-group">
          <span className="farm-alerts-filter-label">Origem</span>
          <div className="farm-alerts-chip-row">
            <button
              type="button"
              className={`farm-alerts-chip ${sourceFilter === "all" ? "is-active" : ""}`}
              onClick={() => handleSourceFilter("all")}
            >
              Todas ({totalCount})
            </button>
            <button
              type="button"
              className={`farm-alerts-chip ${sourceFilter === "reproduction" ? "is-active" : ""}`}
              onClick={() => handleSourceFilter("reproduction")}
            >
              Reprodução ({summaryBySource.reproduction})
            </button>
            <button
              type="button"
              className={`farm-alerts-chip ${sourceFilter === "lactation" ? "is-active" : ""}`}
              onClick={() => handleSourceFilter("lactation")}
            >
              Lactação ({summaryBySource.lactation})
            </button>
            <button
              type="button"
              className={`farm-alerts-chip ${sourceFilter === "health" ? "is-active" : ""}`}
              onClick={() => handleSourceFilter("health")}
            >
              Sanidade ({summaryBySource.health})
            </button>
          </div>
        </div>

        <div className="farm-alerts-filter-group">
          <span className="farm-alerts-filter-label">Severidade</span>
          <div className="farm-alerts-chip-row">
            <button
              type="button"
              className={`farm-alerts-chip ${severityFilter === "all" ? "is-active" : ""}`}
              onClick={() => setSeverityFilter("all")}
            >
              Todas
            </button>
            {(["high", "medium", "low"] as AlertSeverity[]).map((severity) => (
              <button
                key={severity}
                type="button"
                className={`farm-alerts-chip ${severityFilter === severity ? "is-active" : ""}`}
                onClick={() => setSeverityFilter(severity)}
              >
                {SEVERITY_LABELS[severity]}
              </button>
            ))}
          </div>
        </div>

        <div className="farm-alerts-filter-group farm-alerts-filter-group--sort">
          <label htmlFor="alerts-sort" className="farm-alerts-filter-label">Ordenação</label>
          <select
            id="alerts-sort"
            className="form-select"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="priority">Prioridade (maior para menor)</option>
            <option value="date">Data de referência (mais próxima primeiro)</option>
          </select>
        </div>
      </section>

      <section className="card-container farm-alerts-source-grid" aria-label="Resumo por origem">
        {(["reproduction", "lactation", "health"] as AlertSource[]).map((source) => (
          <article key={source} className="farm-alerts-source-card">
            <h2>{SOURCE_LABELS[source]}</h2>
            <strong>{summaryBySource[source]}</strong>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => openSourceDetails(source)}
            >
              Abrir detalhe
            </button>
          </article>
        ))}
      </section>

      <section className="card-container farm-alerts-list" aria-label="Lista consolidada de alertas">
        {loadingItems ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : listError ? (
          <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <span>{listError}</span>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                void refreshAlerts();
                void loadAllItems();
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="alert alert-success">
            <i className="fa-solid fa-check-circle me-2"></i>
            Nenhum alerta encontrado com os filtros selecionados.
          </div>
        ) : (
          (Object.keys(itemsBySeverity) as AlertSeverity[]).map((severity) => {
            const severityItems = itemsBySeverity[severity];
            if (severityItems.length === 0) return null;

            return (
              <div key={severity} className="farm-alerts-list__group">
                <div className="farm-alerts-list__group-header">
                  <h3>{SEVERITY_LABELS[severity]} severidade</h3>
                  <span>{severityItems.length} item(ns)</span>
                </div>
                <div className="list-group">
                  {severityItems.map((item) => (
                    <article key={item.id} className={`list-group-item farm-alert-item farm-alert-item--${item.severity}`}>
                      <div className="farm-alert-item__main">
                        <div className="farm-alert-item__title-row">
                          <i className={getSeverityIcon(item.severity)} aria-hidden="true"></i>
                          <h4>{item.title}</h4>
                          <span className="farm-alert-item__source">{SOURCE_LABELS[item.source]}</span>
                        </div>
                        <p>{item.description}</p>
                        <div className="farm-alert-item__meta">
                          <span>Data: {formatDate(item.date)}</span>
                          <span>Prioridade: {item.priority}</span>
                        </div>
                      </div>
                      <div className="farm-alert-item__actions">
                        {item.link ? (
                          <Link to={item.link} className="btn btn-sm btn-outline-primary">
                            {item.actionLabel || "Ver ação"}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled
                          >
                            Sem ação
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

export default function FarmAlertsPage() {
  const { farmId } = useParams<{ farmId: string }>();
  if (!farmId) return null;

  return (
    <FarmAlertsProvider farmId={parseInt(farmId, 10)}>
      <FarmAlertsContent />
    </FarmAlertsProvider>
  );
}
