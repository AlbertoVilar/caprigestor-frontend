import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import {
  HealthEventCancelRequestDTO,
  HealthEventDoneRequestDTO,
  HealthEventResponseDTO,
  HealthEventStatus,
  HealthEventType
} from "../../Models/HealthDTOs";
import { GoatResponseDTO } from "../../Models/goatResponseDTO";
import HealthFilters, { HealthFiltersValues } from "./components/HealthFilters";
import { HealthStatusBadge } from "./components/HealthStatusBadge";
import CancelHealthEventModal from "./components/CancelHealthEventModal";
import DoneHealthEventModal from "./components/DoneHealthEventModal";
import {
  getFriendlyErrorMessage,
  isForbiddenError,
  isUnauthorizedError
} from "./healthHelpers";
import { HEALTH_EVENT_TYPE_LABELS } from "./healthLabels";
import "./healthPages.css";

const DEFAULT_FILTERS: HealthFiltersValues = {
  type: "",
  status: "",
  from: "",
  to: ""
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const ACTION_TOOLTIP = "Apenas eventos AGENDADOS podem ser alterados.";

export default function HealthPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = Number(searchParams.get("page") ?? "0");
  const currentPage = Number.isNaN(rawPage) || rawPage < 0 ? 0 : rawPage;

  const rawSize = Number(searchParams.get("size") ?? "10");
  const currentPageSize = PAGE_SIZE_OPTIONS.includes(rawSize)
    ? rawSize
    : PAGE_SIZE_OPTIONS[0];

  const lowType = searchParams.get("type");
  const lowStatus = searchParams.get("status");
  const lowFrom = searchParams.get("from");
  const lowTo = searchParams.get("to");

  const appliedFilters: HealthFiltersValues = {
    type: (lowType as HealthEventType) ?? "",
    status: (lowStatus as HealthEventStatus) ?? "",
    from: lowFrom ?? "",
    to: lowTo ?? ""
  };

  const [filterDraft, setFilterDraft] = useState<HealthFiltersValues>(DEFAULT_FILTERS);
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [events, setEvents] = useState<HealthEventResponseDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedForDone, setSelectedForDone] = useState<HealthEventResponseDTO | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<HealthEventResponseDTO | null>(null);

  const farmIdNumber = useMemo(() => (farmId ? Number(farmId) : NaN), [farmId]);

  useEffect(() => {
    setFilterDraft({
      type: appliedFilters.type,
      status: appliedFilters.status,
      from: appliedFilters.from,
      to: appliedFilters.to
    });
  }, [appliedFilters.type, appliedFilters.status, appliedFilters.from, appliedFilters.to]);

  useEffect(() => {
    if (!goatId || Number.isNaN(farmIdNumber)) return;
    let canceled = false;

    fetchGoatById(farmIdNumber, goatId)
      .then((data) => {
        if (!canceled) {
          setGoat(data);
        }
      })
      .catch((error) => {
        console.error("[HealthPage] Falha ao buscar cabra", error);
        toast.error("Erro ao carregar dados do animal.");
      });

    return () => {
      canceled = true;
    };
  }, [farmIdNumber, goatId]);

  const updateSearchParams = (changes: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    setSearchParams(nextParams);
  };

  const loadEvents = useCallback(async () => {
    if (!goatId || Number.isNaN(farmIdNumber)) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const query: {
        type?: HealthEventType;
        status?: HealthEventStatus;
        from?: string;
        to?: string;
        page: number;
        size: number;
      } = {
        page: currentPage,
        size: currentPageSize
      };

      if (appliedFilters.type) {
        query.type = appliedFilters.type as HealthEventType;
      }
      if (appliedFilters.status) {
        query.status = appliedFilters.status as HealthEventStatus;
      }
      if (appliedFilters.from) {
        query.from = appliedFilters.from;
      }
      if (appliedFilters.to) {
        query.to = appliedFilters.to;
      }

      const response = await healthAPI.listByGoat(farmIdNumber, goatId, query);
      setEvents(response.content || []);
      setTotalElements(response.totalElements ?? 0);
      setTotalPages(response.totalPages ?? 0);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }

      setErrorMessage(
        isForbiddenError(error)
          ? "Sem permissão para esta fazenda."
          : getFriendlyErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }, [
    appliedFilters.from,
    appliedFilters.status,
    appliedFilters.to,
    appliedFilters.type,
    currentPage,
    currentPageSize,
    farmIdNumber,
    goatId,
    navigate
  ]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleFilterChange = (field: keyof HealthFiltersValues, value: string) => {
    setFilterDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    updateSearchParams({
      type: filterDraft.type || null,
      status: filterDraft.status || null,
      from: filterDraft.from || null,
      to: filterDraft.to || null,
      page: "0"
    });
  };

  const handleClearFilters = () => {
    setFilterDraft(DEFAULT_FILTERS);
    updateSearchParams({
      type: null,
      status: null,
      from: null,
      to: null,
      page: "0"
    });
  };

  const handlePageSizeChange = (value: number) => {
    updateSearchParams({
      size: value.toString(),
      page: "0"
    });
  };

  const goToPage = (target: number) => {
    if (target < 0) return;
    if (totalPages > 0 && target >= totalPages) return;
    updateSearchParams({ page: target.toString() });
  };

  const handleMarkAsDone = useCallback(
    async (event: HealthEventResponseDTO, payload: HealthEventDoneRequestDTO) => {
      if (!goatId || Number.isNaN(farmIdNumber)) {
        throw new Error("Evento inválido.");
      }

      try {
        await healthAPI.markAsDone(farmIdNumber, goatId, event.id, payload);
        toast.success("Evento marcado como realizado.");
        setSelectedForDone(null);
        await loadEvents();
      } catch (error) {
        const message = getFriendlyErrorMessage(error, "Erro ao marcar como realizado.");
        toast.error(message);
        throw new Error(message);
      }
    },
    [farmIdNumber, goatId, loadEvents]
  );

  const handleCancelEvent = useCallback(
    async (event: HealthEventResponseDTO, payload: HealthEventCancelRequestDTO) => {
      if (!goatId || Number.isNaN(farmIdNumber)) {
        throw new Error("Evento inválido.");
      }

      try {
        await healthAPI.cancel(farmIdNumber, goatId, event.id, payload);
        toast.success("Evento cancelado.");
        setSelectedForCancel(null);
        await loadEvents();
      } catch (error) {
        const message = getFriendlyErrorMessage(error, "Erro ao cancelar evento.");
        toast.error(message);
        throw new Error(message);
      }
    },
    [farmIdNumber, goatId, loadEvents]
  );

  const displayStart =
    events.length > 0 ? currentPage * currentPageSize + 1 : 0;
  const displayEnd =
    events.length > 0
      ? Math.min(displayStart + events.length - 1, totalElements || 0)
      : 0;

  const hasPaginationInfo = !loading && !errorMessage;
  const isPrevDisabled = currentPage <= 0;
  const isNextDisabled =
    totalPages > 0 ? currentPage + 1 >= totalPages : true;

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("pt-BR") : "-";

  return (
    <div className="health-page">
      <section className="health-hero">
        <div className="health-hero__meta">
          <button className="health-btn health-btn-text health-hero__back" type="button" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Voltar
          </button>
          <div>
            <h1>Controle Sanitário</h1>
            <p className="health-hero__animal">
              Animal: <strong>{goat?.name ?? goatId}</strong> (Reg: {goat?.registrationNumber ?? goatId})
            </p>
          </div>
        </div>
        <div className="health-hero__actions">
          <button className="health-btn health-btn-primary" type="button" onClick={() => navigate("new")}>
            <i className="fa-solid fa-plus" aria-hidden="true"></i> Novo Evento
          </button>
        </div>
      </section>

      <div className="health-filters-shell">
        <HealthFilters
          values={filterDraft}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          isBusy={loading}
        />
      </div>

      <div className="health-table-wrapper">
        {loading ? (
          <div className="health-table-skeleton" role="status" aria-live="polite">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="health-table-skeleton-row" key={index}>
                <span className="health-table-skeleton-cell short" />
                <span className="health-table-skeleton-cell medium" />
                <span className="health-table-skeleton-cell long" />
                <span className="health-table-skeleton-cell short" />
                <span className="health-table-skeleton-cell actions" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="health-error-state">
            <p>{errorMessage}</p>
            <button type="button" className="health-btn health-btn-primary" onClick={loadEvents}>
              Tentar novamente
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="health-empty-state">
            <p>Nenhum evento encontrado</p>
            <button type="button" className="health-btn health-btn-primary" onClick={() => navigate("new")}>
              Novo Evento
            </button>
          </div>
        ) : (
          <table className="health-table">
            <thead>
              <tr>
                <th>Data Agendada</th>
                <th>Tipo</th>
                <th>Título/Descrição</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const isScheduled = event.status === HealthEventStatus.AGENDADO;
                const isOverdue = isScheduled && event.overdue;
                return (
                  <tr
                    key={event.id}
                    className={`health-table-row ${isOverdue ? "health-table-row--overdue" : ""}`}
                  >
                    <td>{formatDate(event.scheduledDate)}</td>
                    <td>
                      <span className="health-type-pill">{HEALTH_EVENT_TYPE_LABELS[event.type] || event.type}</span>
                    </td>
                    <td>
                      <div className="health-row__title">{event.title}</div>
                      {event.description && (
                        <p className="health-row__description">{event.description}</p>
                      )}
                      {event.productName && (
                        <small className="health-row__product">Produto: {event.productName}</small>
                      )}
                    </td>
                    <td>
                      <HealthStatusBadge status={event.status} overdue={event.overdue} />
                    </td>
                    <td>
                      <div className="health-action-group">
                        <button
                          type="button"
                          className="health-action-btn"
                          title="Ver detalhes"
                          aria-label="Ver detalhes"
                          onClick={() => navigate(`${event.id}`)}
                        >
                          <i className="fa-solid fa-eye" />
                        </button>
                        <button
                          type="button"
                          className={`health-action-btn ${isScheduled ? "" : "health-action-btn--disabled"}`}
                          title={isScheduled ? "Editar" : ACTION_TOOLTIP}
                          aria-label="Editar"
                          disabled={!isScheduled}
                          onClick={() => {
                            if (isScheduled) {
                              navigate(`${event.id}/edit`);
                            }
                          }}
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button
                          type="button"
                          className={`health-action-btn health-action-btn--success ${isScheduled ? "" : "health-action-btn--disabled"}`}
                          title={isScheduled ? "Marcar como realizado" : ACTION_TOOLTIP}
                          aria-label="Marcar como realizado"
                          disabled={!isScheduled}
                          onClick={() => {
                            if (isScheduled) {
                              setSelectedForDone(event);
                            }
                          }}
                        >
                          <i className="fa-solid fa-check" />
                        </button>
                        <button
                          type="button"
                          className={`health-action-btn health-action-btn--danger ${isScheduled ? "" : "health-action-btn--disabled"}`}
                          title={isScheduled ? "Cancelar evento" : ACTION_TOOLTIP}
                          aria-label="Cancelar evento"
                          disabled={!isScheduled}
                          onClick={() => {
                            if (isScheduled) {
                              setSelectedForCancel(event);
                            }
                          }}
                        >
                          <i className="fa-solid fa-ban" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {hasPaginationInfo && (
          <div className="health-table-footer">
            <div className="health-pagination-info">
              Exibindo {displayStart}–{displayEnd} de {totalElements}
            </div>
            <div className="health-pagination-controls">
              <div className="health-page-size">
                <label htmlFor="health-page-size">Itens por página</label>
                <select
                  id="health-page-size"
                  value={currentPageSize}
                  onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="health-pagination-buttons">
                <button
                  type="button"
                  className="health-pagination-btn"
                  disabled={isPrevDisabled}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {Math.max(currentPage + 1, 1)} de {Math.max(totalPages, 1)}
                </span>
                <button
                  type="button"
                  className="health-pagination-btn"
                  disabled={isNextDisabled}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DoneHealthEventModal
        isOpen={Boolean(selectedForDone)}
        eventTitle={selectedForDone?.title}
        onClose={() => setSelectedForDone(null)}
        onConfirm={(payload) => {
          if (!selectedForDone) {
            return Promise.reject(new Error("Evento não encontrado."));
          }
          return handleMarkAsDone(selectedForDone, payload);
        }}
      />

      <CancelHealthEventModal
        isOpen={Boolean(selectedForCancel)}
        eventTitle={selectedForCancel?.title}
        onClose={() => setSelectedForCancel(null)}
        onConfirm={(notes) => {
          if (!selectedForCancel) {
            return Promise.reject(new Error("Evento não encontrado."));
          }
          return handleCancelEvent(selectedForCancel, { notes });
        }}
      />
    </div>
  );
}
