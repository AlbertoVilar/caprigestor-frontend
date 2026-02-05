import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { RoleEnum } from "../../Models/auth";
import { PermissionService } from "../../services/PermissionService";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import {
  HealthEventCancelRequestDTO,
  HealthEventDoneRequestDTO,
  HealthEventResponseDTO,
  HealthEventStatus,
  HealthEventType
} from "../../Models/HealthDTOs";
import { HealthAlertsDTO } from "../../Models/HealthAlertsDTO";
import { GoatFarmDTO } from "../../Models/goatFarm";
import HealthFilters, { HealthFiltersValues } from "./components/HealthFilters";
import FarmHealthAlertsPanel from "./components/FarmHealthAlertsPanel";
import FarmHealthCalendarTable from "./components/FarmHealthCalendarTable";
import CancelHealthEventModal from "./components/CancelHealthEventModal";
import DoneHealthEventModal from "./components/DoneHealthEventModal";
import ReopenHealthEventModal from "./components/ReopenHealthEventModal";
import {
  getFriendlyErrorMessage,
  isForbiddenError,
  isUnauthorizedError
} from "./healthHelpers";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
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

  // --- Pagination State ---
  const rawPage = Number(searchParams.get("page") ?? "0");
  const currentPage = Number.isNaN(rawPage) || rawPage < 0 ? 0 : rawPage;

  const rawSize = Number(searchParams.get("size") ?? "10");
  const currentPageSize = PAGE_SIZE_OPTIONS.includes(rawSize)
    ? rawSize
    : PAGE_SIZE_OPTIONS[0];

  // --- Filter State ---
  const lowType = searchParams.get("type");
  const lowStatus = searchParams.get("status");
  const lowFrom = searchParams.get("from");
  const lowTo = searchParams.get("to");

  const appliedFilters = useMemo<HealthFiltersValues>(() => ({
    type: (lowType as HealthEventType) ?? "",
    status: (lowStatus as HealthEventStatus) ?? "",
    from: lowFrom ?? "",
    to: lowTo ?? ""
  }), [lowType, lowStatus, lowFrom, lowTo]);

  const [filterDraft, setFilterDraft] = useState<HealthFiltersValues>(DEFAULT_FILTERS);

  // --- Data State ---
  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [alerts, setAlerts] = useState<HealthAlertsDTO | null>(null);
  const [events, setEvents] = useState<HealthEventResponseDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // --- Loading/Error State ---
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // --- Modal State ---
  const [selectedForDone, setSelectedForDone] = useState<HealthEventResponseDTO | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<HealthEventResponseDTO | null>(null);
  const [selectedForReopen, setSelectedForReopen] = useState<HealthEventResponseDTO | null>(null);
  const [showCanceled, setShowCanceled] = useState(false);

  const farmIdNumber = useMemo(() => (farmId ? Number(farmId) : NaN), [farmId]);

  const userRole = tokenPayload?.authorities[0] || RoleEnum.ROLE_PUBLIC;
  const showReopenAction = PermissionService.canReopenEvent(userRole, tokenPayload?.userId, farmData?.ownerId);

  const filteredEvents = useMemo(() => {
    if (showCanceled) return events;
    return events.filter((e) => e.status !== HealthEventStatus.CANCELADO);
  }, [events, showCanceled]);

  // Sync draft with URL params
  useEffect(() => {
    setFilterDraft({
      type: appliedFilters.type,
      status: appliedFilters.status,
      from: appliedFilters.from,
      to: appliedFilters.to
    });
  }, [appliedFilters.type, appliedFilters.status, appliedFilters.from, appliedFilters.to]);

  // Fetch Farm Data
  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) return;
    
    getGoatFarmById(farmIdNumber)
      .then(setFarmData)
      .catch((err) => console.error("Erro ao carregar fazenda", err));
  }, [farmIdNumber]);

  // Fetch Alerts
  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) return;

    setLoadingAlerts(true);
    healthAPI.getAlerts(farmIdNumber)
      .then(setAlerts)
      .catch((err) => {
        console.error("Erro ao carregar alertas", err);
        // We set alerts to null so the panel can show error state
        setAlerts(null);
      })
      .finally(() => setLoadingAlerts(false));
  }, [farmIdNumber]);

  // Fetch Calendar (Events)
  const loadEvents = useCallback(async () => {
    if (Number.isNaN(farmIdNumber)) return;
    setLoadingCalendar(true);
    setErrorMessage("");

    try {
      const query: Record<string, string | number> = {
        page: currentPage,
        size: currentPageSize
      };

      if (appliedFilters.type) query.type = appliedFilters.type;
      
      if (appliedFilters.status) {
        query.status = appliedFilters.status;
      } else if (showCanceled) {
        // If no status filter is applied but "Show Canceled" is on, fetch canceled events
        query.status = HealthEventStatus.CANCELADO;
      }
      
      // Workaround for backend error "could not determine data type of parameter"
      // We explicitly send a wide date range instead of null
      query.from = appliedFilters.from || "2000-01-01";
      query.to = appliedFilters.to || "2099-12-31";

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
  }, [
    appliedFilters,
    currentPage,
    currentPageSize,
    farmIdNumber,
    navigate
  ]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // --- Handlers ---

  const updateSearchParams = (changes: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") nextParams.delete(key);
      else nextParams.set(key, value);
    });
    setSearchParams(nextParams);
  };

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
        // Assuming upcoming is next 7 days as per alert window
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        newParams.status = HealthEventStatus.AGENDADO;
        newParams.from = today;
        newParams.to = nextWeek.toISOString().split("T")[0];
    } else if (filterType === "overdue") {
       // Backend handles overdue logic, but for filter we might just filter by status AGENDADO and rely on visual cues, 
       // OR we set a 'to' date in the past. 
       // Since the API filter might not have "overdue=true", we typically filter AGENDADO + To < Today.
       // However, let's just clear dates and set Status=AGENDADO for now, or maybe the user wants to see *all* overdue.
       // Better UX: Filter Status=AGENDADO. The user can sort/see badges.
       // Ideally we'd have a specific "overdue" query param, but let's stick to standard filters.
       // Let's set Status=AGENDADO and clear dates to show all pending.
       newParams.status = HealthEventStatus.AGENDADO;
       newParams.from = null;
       newParams.to = null; 
       // Or set 'to' = yesterday
       const yesterday = new Date();
       yesterday.setDate(yesterday.getDate() - 1);
       newParams.to = yesterday.toISOString().split("T")[0];
    }

    // Update draft to match
    setFilterDraft(prev => ({
        ...prev,
        status: newParams.status as HealthEventStatus || "",
        from: newParams.from || "",
        to: newParams.to || ""
    }));

    updateSearchParams(newParams);
    
    // Scroll to table
    document.querySelector(".health-filters-shell")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNavigateToDetail = (goatId: string, eventId: number) => {
    // Navigate to existing goat-specific detail page
    // Route: /app/goatfarms/:farmId/goats/:goatId/health/:eventId
    navigate(`/app/goatfarms/${farmIdNumber}/goats/${goatId}/health/${eventId}`);
  };

  const handleMarkAsDone = async (event: HealthEventResponseDTO, payload: HealthEventDoneRequestDTO) => {
    try {
      await healthAPI.markAsDone(farmIdNumber, event.goatId, event.id, payload);
      toast.success("Evento realizado com sucesso!");
      setSelectedForDone(null);
      loadEvents(); // Reload calendar
      // Also reload alerts? Ideally yes.
      healthAPI.getAlerts(farmIdNumber).then(setAlerts);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Erro ao marcar como realizado."));
    }
  };

  const handleCancel = async (event: HealthEventResponseDTO, payload: HealthEventCancelRequestDTO) => {
    try {
      await healthAPI.cancel(farmIdNumber, event.goatId, event.id, payload);
      toast.success("Evento cancelado.");
      setSelectedForCancel(null);
      loadEvents();
      healthAPI.getAlerts(farmIdNumber).then(setAlerts);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Erro ao cancelar evento."));
    }
  };

  const handleReopenEvent = useCallback(async () => {
    if (!selectedForReopen || Number.isNaN(farmIdNumber)) return;

    try {
      await healthAPI.reopen(farmIdNumber, selectedForReopen.goatId, selectedForReopen.id);
      toast.success("Evento reaberto com sucesso.");
      setSelectedForReopen(null);
      await loadEvents();
      healthAPI.getAlerts(farmIdNumber).then(setAlerts);
    } catch (error) {
      if (isForbiddenError(error)) {
        toast.error("Você não tem permissão para reabrir este evento.");
      } else {
        const message = getFriendlyErrorMessage(error, "Erro ao reabrir evento.");
        toast.error(message);
      }
    }
  }, [farmIdNumber, selectedForReopen, loadEvents]);

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
                <h1>Agenda Sanitária da Fazenda</h1>
                <p className="text-muted">Visão geral de eventos sanitários de todo o rebanho</p>
            </div>
        </div>
      </section>

      <FarmHealthAlertsPanel 
        alerts={alerts} 
        loading={loadingAlerts} 
        onFilterChange={handleAlertFilterClick}
        onNavigateToDetail={handleNavigateToDetail}
      />

      <div className="health-filters-shell">
        <h3 className="mb-3 ps-2 border-start border-4 border-success">Todos os Eventos</h3>
        <HealthFilters
          values={filterDraft}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          isBusy={loadingCalendar}
          showCanceled={showCanceled}
          onToggleCanceled={() => setShowCanceled((prev) => !prev)}
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

      {/* Modals */}
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
