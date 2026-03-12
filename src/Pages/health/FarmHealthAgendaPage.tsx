import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getFarmDryOffAlerts } from "../../api/GoatFarmAPI/lactation";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { getFarmPregnancyDiagnosisAlerts } from "../../api/GoatFarmAPI/reproduction";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import { useAuth } from "../../contexts/AuthContext";
import {
  HealthEventCancelRequestDTO,
  HealthEventDoneRequestDTO,
  HealthEventResponseDTO,
  HealthEventStatus,
  HealthEventType
} from "../../Models/HealthDTOs";
import { HealthAlertsDTO } from "../../Models/HealthAlertsDTO";
import { LactationDryOffAlertResponseDTO } from "../../Models/LactationDTOs";
import { RoleEnum } from "../../Models/auth";
import { PregnancyDiagnosisAlertResponseDTO } from "../../Models/ReproductionDTOs";
import { GoatFarmDTO } from "../../Models/goatFarm";
import { PermissionService } from "../../services/PermissionService";
import CancelHealthEventModal from "./components/CancelHealthEventModal";
import DoneHealthEventModal from "./components/DoneHealthEventModal";
import FarmHealthAlertsPanel from "./components/FarmHealthAlertsPanel";
import FarmHealthCalendarTable from "./components/FarmHealthCalendarTable";
import FarmOperationalAgendaPanel from "./components/FarmOperationalAgendaPanel";
import HealthFilters, { HealthFiltersValues } from "./components/HealthFilters";
import ReopenHealthEventModal from "./components/ReopenHealthEventModal";
import {
  buildFarmOperationalAgenda,
  type FarmOperationalAgendaFilter,
  type FarmOperationalAgendaItem
} from "./farmOperationalAgenda";
import {
  getFriendlyErrorMessage,
  isForbiddenError,
  isUnauthorizedError
} from "./healthHelpers";
import "./healthPages.css";

const DEFAULT_FILTERS: HealthFiltersValues = {
  type: "",
  status: "",
  from: "",
  to: ""
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function FarmHealthAgendaPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tokenPayload } = useAuth();

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

  const appliedFilters = useMemo<HealthFiltersValues>(() => ({
    type: (lowType as HealthEventType) ?? "",
    status: (lowStatus as HealthEventStatus) ?? "",
    from: lowFrom ?? "",
    to: lowTo ?? ""
  }), [lowFrom, lowStatus, lowTo, lowType]);

  const [filterDraft, setFilterDraft] = useState<HealthFiltersValues>(DEFAULT_FILTERS);
  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [alerts, setAlerts] = useState<HealthAlertsDTO | null>(null);
  const [pregnancyAlerts, setPregnancyAlerts] = useState<PregnancyDiagnosisAlertResponseDTO | null>(null);
  const [dryOffAlerts, setDryOffAlerts] = useState<LactationDryOffAlertResponseDTO | null>(null);
  const [events, setEvents] = useState<HealthEventResponseDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [operationalWarning, setOperationalWarning] = useState("");
  const [selectedForDone, setSelectedForDone] = useState<HealthEventResponseDTO | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<HealthEventResponseDTO | null>(null);
  const [selectedForReopen, setSelectedForReopen] = useState<HealthEventResponseDTO | null>(null);
  const [showCanceled, setShowCanceled] = useState(false);
  const [operationalFilter, setOperationalFilter] = useState<FarmOperationalAgendaFilter>("all");

  const farmIdNumber = useMemo(() => (farmId ? Number(farmId) : NaN), [farmId]);
  const userRole = tokenPayload?.authorities[0] || RoleEnum.ROLE_PUBLIC;
  const showReopenAction = PermissionService.canReopenEvent(userRole, tokenPayload?.userId, farmData?.ownerId);

  const filteredEvents = useMemo(() => {
    if (showCanceled) return events;
    return events.filter((event) => event.status !== HealthEventStatus.CANCELADO);
  }, [events, showCanceled]);

  const operationalAgenda = useMemo(
    () => buildFarmOperationalAgenda(farmIdNumber, {
      healthAlerts: alerts,
      pregnancyAlerts,
      dryOffAlerts,
      maxItems: 8
    }),
    [alerts, dryOffAlerts, farmIdNumber, pregnancyAlerts]
  );

  const operationalItems = useMemo(() => {
    if (operationalFilter === "all") return operationalAgenda.items;
    return operationalAgenda.items.filter((item) => item.source === operationalFilter);
  }, [operationalAgenda.items, operationalFilter]);

  useEffect(() => {
    setFilterDraft({
      type: appliedFilters.type,
      status: appliedFilters.status,
      from: appliedFilters.from,
      to: appliedFilters.to
    });
  }, [appliedFilters.from, appliedFilters.status, appliedFilters.to, appliedFilters.type]);

  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) return;

    getGoatFarmById(farmIdNumber)
      .then(setFarmData)
      .catch((error) => console.error("Erro ao carregar fazenda", error));
  }, [farmIdNumber]);

  const loadOperationalAlerts = useCallback(async () => {
    if (Number.isNaN(farmIdNumber)) return;

    setLoadingAlerts(true);
    setOperationalWarning("");

    const [healthResult, pregnancyResult, dryOffResult] = await Promise.allSettled([
      healthAPI.getAlerts(farmIdNumber),
      getFarmPregnancyDiagnosisAlerts(farmIdNumber, { page: 0, size: 5 }),
      getFarmDryOffAlerts(farmIdNumber, { page: 0, size: 5 })
    ]);

    const failedSources: string[] = [];

    if (healthResult.status === "fulfilled") {
      setAlerts(healthResult.value);
    } else {
      console.error("Erro ao carregar alertas de sanidade", healthResult.reason);
      setAlerts(null);
      failedSources.push("sanidade");
    }

    if (pregnancyResult.status === "fulfilled") {
      setPregnancyAlerts(pregnancyResult.value);
    } else {
      console.error("Erro ao carregar alertas de reprodução", pregnancyResult.reason);
      setPregnancyAlerts(null);
      failedSources.push("reprodução");
    }

    if (dryOffResult.status === "fulfilled") {
      setDryOffAlerts(dryOffResult.value);
    } else {
      console.error("Erro ao carregar alertas de lactação", dryOffResult.reason);
      setDryOffAlerts(null);
      failedSources.push("lactação");
    }

    if (failedSources.length > 0) {
      setOperationalWarning(
        `Parte da agenda operacional não pôde ser carregada agora (${failedSources.join(", ")}).`
      );
    }

    setLoadingAlerts(false);
  }, [farmIdNumber]);

  useEffect(() => {
    loadOperationalAlerts();
  }, [loadOperationalAlerts]);

  const loadEvents = useCallback(async () => {
    if (Number.isNaN(farmIdNumber)) return;

    setLoadingCalendar(true);
    setErrorMessage("");

    try {
      const query: Record<string, string | number> = {
        page: currentPage,
        size: currentPageSize,
        from: appliedFilters.from || "2000-01-01",
        to: appliedFilters.to || "2099-12-31"
      };

      if (appliedFilters.type) query.type = appliedFilters.type;

      if (appliedFilters.status) {
        query.status = appliedFilters.status;
      } else if (showCanceled) {
        query.status = HealthEventStatus.CANCELADO;
      }

      const response = await healthAPI.getCalendar(farmIdNumber, query);
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
          ? "Sem permissão para visualizar eventos desta fazenda."
          : getFriendlyErrorMessage(error)
      );
    } finally {
      setLoadingCalendar(false);
    }
  }, [appliedFilters.from, appliedFilters.status, appliedFilters.to, appliedFilters.type, currentPage, currentPageSize, farmIdNumber, navigate, showCanceled]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const updateSearchParams = (changes: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") nextParams.delete(key);
      else nextParams.set(key, value);
    });

    setSearchParams(nextParams);
  };

  const handleFilterChange = (field: keyof HealthFiltersValues, value: string) => {
    setFilterDraft((previous) => ({ ...previous, [field]: value }));
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

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || (totalPages > 0 && newPage >= totalPages)) return;
    updateSearchParams({ page: newPage.toString() });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateSearchParams({ size: newSize.toString(), page: "0" });
  };

  const handleAlertFilterClick = (filterType: "today" | "upcoming" | "overdue") => {
    const today = new Date().toISOString().split("T")[0];
    const newParams: Record<string, string | null> = { page: "0" };

    if (filterType === "today") {
      newParams.status = HealthEventStatus.AGENDADO;
      newParams.from = today;
      newParams.to = today;
    } else if (filterType === "upcoming") {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      newParams.status = HealthEventStatus.AGENDADO;
      newParams.from = today;
      newParams.to = nextWeek.toISOString().split("T")[0];
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      newParams.status = HealthEventStatus.AGENDADO;
      newParams.from = null;
      newParams.to = yesterday.toISOString().split("T")[0];
    }

    setFilterDraft((previous) => ({
      ...previous,
      status: (newParams.status as HealthEventStatus) || "",
      from: newParams.from || "",
      to: newParams.to || ""
    }));

    updateSearchParams(newParams);
    document.querySelector(".health-filters-shell")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNavigateToDetail = (goatId: string, eventId: number) => {
    navigate(`/app/goatfarms/${farmIdNumber}/goats/${goatId}/health/${eventId}`);
  };

  const handleMarkAsDone = useCallback(async (event: HealthEventResponseDTO, payload: HealthEventDoneRequestDTO) => {
    try {
      await healthAPI.markAsDone(farmIdNumber, event.goatId, event.id, payload);
      toast.success("Evento realizado com sucesso!");
      setSelectedForDone(null);
      await loadEvents();
      await loadOperationalAlerts();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Erro ao marcar como realizado."));
    }
  }, [farmIdNumber, loadEvents, loadOperationalAlerts]);

  const handleCancel = useCallback(async (event: HealthEventResponseDTO, payload: HealthEventCancelRequestDTO) => {
    try {
      await healthAPI.cancel(farmIdNumber, event.goatId, event.id, payload);
      toast.success("Evento cancelado.");
      setSelectedForCancel(null);
      await loadEvents();
      await loadOperationalAlerts();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Erro ao cancelar evento."));
    }
  }, [farmIdNumber, loadEvents, loadOperationalAlerts]);

  const handleReopenEvent = useCallback(async () => {
    if (!selectedForReopen || Number.isNaN(farmIdNumber)) return;

    try {
      await healthAPI.reopen(farmIdNumber, selectedForReopen.goatId, selectedForReopen.id);
      toast.success("Evento reaberto com sucesso.");
      setSelectedForReopen(null);
      await loadEvents();
      await loadOperationalAlerts();
    } catch (error) {
      if (isForbiddenError(error)) {
        toast.error("Você não tem permissão para reabrir este evento.");
      } else {
        toast.error(getFriendlyErrorMessage(error, "Erro ao reabrir evento."));
      }
    }
  }, [farmIdNumber, loadEvents, loadOperationalAlerts, selectedForReopen]);

  const handleOperationalItemOpen = useCallback((item: FarmOperationalAgendaItem) => {
    navigate(item.href);
  }, [navigate]);

  if (Number.isNaN(farmIdNumber)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <i className="fa-solid fa-triangle-exclamation me-2"></i>
          Identificador da fazenda inválido ou ausente.
          <br />
          <button className="btn btn-outline-danger mt-3" onClick={() => navigate("/goatfarms")}>
            Voltar para Fazendas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="health-page">
      <GoatFarmHeader
        name={farmData?.name || "Capril"}
        logoUrl={farmData?.logoUrl}
        farmId={farmIdNumber}
      />

      <section className="health-hero mb-4">
        <div className="health-hero__meta">
          <button className="health-btn health-btn-text health-hero__back" type="button" onClick={() => navigate("/goatfarms")}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Voltar ao Painel
          </button>
          <div>
            <h1>Agenda Operacional da Fazenda</h1>
            <p className="text-muted">
              Resumo da rotina por sanidade, reprodução e lactação. O detalhamento abaixo continua sanitário.
            </p>
          </div>
        </div>
      </section>

      <FarmOperationalAgendaPanel
        loading={loadingAlerts}
        warningMessage={operationalWarning}
        summary={operationalAgenda}
        activeFilter={operationalFilter}
        items={operationalItems}
        onFilterChange={setOperationalFilter}
        onOpenItem={handleOperationalItemOpen}
        onOpenAlerts={() => navigate(`/app/goatfarms/${farmIdNumber}/alerts`)}
      />

      <FarmHealthAlertsPanel
        alerts={alerts}
        loading={loadingAlerts}
        onFilterChange={handleAlertFilterClick}
        onNavigateToDetail={handleNavigateToDetail}
      />

      <div className="health-filters-shell">
        <h3 className="mb-3 ps-2 border-start border-4 border-success">Detalhamento sanitário</h3>
        <HealthFilters
          values={filterDraft}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          isBusy={loadingCalendar}
          showCanceled={showCanceled}
          onToggleCanceled={() => setShowCanceled((previous) => !previous)}
        />
      </div>

      <FarmHealthCalendarTable
        events={filteredEvents}
        loading={loadingCalendar}
        errorMessage={errorMessage}
        totalElements={totalElements}
        totalPages={totalPages}
        currentPage={currentPage}
        currentPageSize={currentPageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onViewDetail={handleNavigateToDetail}
        onMarkDone={setSelectedForDone}
        onCancel={setSelectedForCancel}
        onReopen={showReopenAction ? setSelectedForReopen : undefined}
        onRetry={loadEvents}
        areCanceledHidden={!showCanceled && events.length > 0}
        onShowCanceled={() => setShowCanceled(true)}
      />

      <DoneHealthEventModal
        isOpen={Boolean(selectedForDone)}
        eventTitle={selectedForDone?.title}
        onClose={() => setSelectedForDone(null)}
        onConfirm={(payload) => {
          if (!selectedForDone) return Promise.reject(new Error("Evento não encontrado."));
          return handleMarkAsDone(selectedForDone, payload);
        }}
      />

      <CancelHealthEventModal
        isOpen={Boolean(selectedForCancel)}
        eventTitle={selectedForCancel?.title}
        onClose={() => setSelectedForCancel(null)}
        onConfirm={(notes) => {
          if (!selectedForCancel) return Promise.reject(new Error("Evento não encontrado."));
          return handleCancel(selectedForCancel, { notes });
        }}
      />

      <ReopenHealthEventModal
        isOpen={Boolean(selectedForReopen)}
        eventTitle={selectedForReopen?.title}
        onClose={() => setSelectedForReopen(null)}
        onConfirm={handleReopenEvent}
      />
    </div>
  );
}
