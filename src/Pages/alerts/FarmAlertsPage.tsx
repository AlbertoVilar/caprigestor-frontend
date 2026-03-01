import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { AlertItem } from "../../services/alerts/AlertRegistry";
import { FarmAlertsProvider, useFarmAlerts } from "../../contexts/alerts/FarmAlertsContext";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import "../../index.css";
import "./FarmAlertsPage.css";

const PAGE_SIZE = 20;

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function FarmAlertsContent() {
  const { farmId } = useParams<{ farmId: string }>();
  const farmIdNumber = Number(farmId);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { providerStates, getProvider } = useFarmAlerts();

  const currentType = searchParams.get("type") ?? searchParams.get("tab");

  const [items, setItems] = useState<AlertItem[]>([]);
  const [page, setPage] = useState(0);
  const [loadingItems, setLoadingItems] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentType && providerStates.length > 0) {
      setSearchParams({ type: providerStates[0].providerKey }, { replace: true });
    }
  }, [providerStates, currentType, setSearchParams]);

  useEffect(() => {
    setPage(0);
  }, [currentType]);

  const selectedProvider = currentType ? getProvider(currentType) : undefined;
  const selectedProviderState = providerStates.find((state) => state.providerKey === selectedProvider?.key);
  const selectedCount = selectedProviderState?.summary.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(selectedCount / PAGE_SIZE));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const loadItems = useCallback(async () => {
    if (!farmId || Number.isNaN(farmIdNumber) || !selectedProvider?.getList) {
      setItems([]);
      setListError(null);
      return;
    }

    setLoadingItems(true);
    setListError(null);

    try {
      const data = await selectedProvider.getList(farmIdNumber, {
        page,
        size: PAGE_SIZE
      });
      setItems(data);
    } catch (error) {
      console.error("Error loading alert items", error);
      setListError("Nao foi possivel carregar os alertas desta categoria.");
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [farmId, farmIdNumber, selectedProvider, page]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const isDryOffTab = selectedProvider?.key === "lactation_drying";

  const tabModels = useMemo(
    () =>
      providerStates
        .map((state) => ({ state, provider: getProvider(state.providerKey) }))
        .filter(
          (entry): entry is {
            state: (typeof providerStates)[number];
            provider: NonNullable<ReturnType<typeof getProvider>>;
          } => Boolean(entry.provider)
        ),
    [providerStates, getProvider]
  );

  return (
    <div className="page-container">
      <GoatFarmHeader
        name="Central de Alertas"
        farmId={farmIdNumber}
        useExternalAlertsProvider={false}
      />

      <PageHeader
        title="Alertas e Pendencias"
        description="Gerencie as pendencias da fazenda"
        showBackButton={true}
        backButtonUrl={buildFarmDashboardPath(farmIdNumber)}
      />

      <div className="card-container">
        <div className="nav nav-tabs mb-3">
          {tabModels.map(({ state, provider }) => {
            const isActive = currentType === provider.key;

            return (
              <button
                key={provider.key}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => setSearchParams({ type: provider.key })}
              >
                {provider.label}
                {state.summary.count > 0 && (
                  <span className="badge ms-2 bg-danger">{state.summary.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="tab-content">
          {!selectedProvider ? (
            <div className="alert alert-info">Selecione uma categoria de alertas.</div>
          ) : !selectedProvider.getList ? (
            <div className="alert alert-info d-flex justify-content-between align-items-center gap-3 flex-wrap">
              <span>Essa categoria possui detalhes em uma pagina dedicada.</span>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate(selectedProvider.getRoute(farmIdNumber))}
              >
                Abrir pagina
              </button>
            </div>
          ) : loadingItems ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : listError ? (
            <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3 flex-wrap">
              <span>{listError}</span>
              <button className="btn btn-sm btn-outline-danger" onClick={() => void loadItems()}>
                Tentar novamente
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="alert alert-success">
              <i className="fa-solid fa-check-circle me-2"></i>
              {isDryOffTab
                ? "Nenhuma secagem pendente!"
                : `Nenhuma pendencia encontrada para ${selectedProvider.label}.`}
            </div>
          ) : isDryOffTab ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle dryoff-alerts-table">
                <thead>
                  <tr>
                    <th>Cabra</th>
                    <th>Data sugerida de secagem</th>
                    <th>Dias de gestacao</th>
                    <th>Atraso</th>
                    <th>Base (prenhez)</th>
                    <th className="text-end">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const overdue = item.daysOverdue ?? 0;
                    return (
                      <tr key={item.id}>
                        <td>
                          {item.link ? (
                            <Link to={item.link} className="fw-semibold text-decoration-none">
                              {item.goatId}
                            </Link>
                          ) : (
                            item.goatId
                          )}
                        </td>
                        <td>{formatDate(item.dryOffDate ?? item.date)}</td>
                        <td>{item.gestationDays ?? "-"}</td>
                        <td>
                          {overdue > 0 ? (
                            <span className="badge bg-danger">+{overdue} dia(s)</span>
                          ) : (
                            <span className="badge bg-success">No prazo</span>
                          )}
                        </td>
                        <td>{formatDate(item.startDatePregnancy)}</td>
                        <td className="text-end">
                          {item.link && (
                            <Link to={item.link} className="btn btn-sm btn-outline-primary">
                              Ver lactacao
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="list-group">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`list-group-item list-group-item-action flex-column align-items-start ${
                    item.severity === "high" ? "border-danger" : ""
                  }`}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">
                      {item.severity === "high" && (
                        <i className="fa-solid fa-triangle-exclamation text-danger me-2"></i>
                      )}
                      {item.title}
                    </h5>
                    <small>{formatDate(item.date)}</small>
                  </div>
                  <p className="mb-1">{item.description}</p>
                  <div className="mt-2">
                    {item.link ? (
                      <Link to={item.link} className="btn btn-sm btn-outline-primary">
                        Ver detalhes
                      </Link>
                    ) : item.onAction ? (
                      <button onClick={item.onAction} className="btn btn-sm btn-outline-primary">
                        {item.actionLabel || "Resolver"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProvider?.getList && selectedCount > PAGE_SIZE && (
          <div className="alerts-pagination mt-3">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page === 0}
              onClick={() => setPage((previous) => Math.max(previous - 1, 0))}
            >
              Anterior
            </button>
            <span>
              Pagina {page + 1} de {totalPages}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((previous) => Math.min(previous + 1, totalPages - 1))}
            >
              Proxima
            </button>
          </div>
        )}
      </div>
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
