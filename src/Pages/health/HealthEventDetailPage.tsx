import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import {
  HealthEventResponseDTO,
  HealthEventType,
  HealthEventStatus,
  HealthEventDoneRequestDTO,
  HealthEventCancelRequestDTO,
} from "../../Models/HealthDTOs";
import { GoatFarmDTO } from "../../Models/goatFarm";
import { useAuth } from "../../contexts/AuthContext";
import { RoleEnum } from "../../Models/auth";
import "./healthPages.css";
import DoneHealthEventModal from "./components/DoneHealthEventModal";
import CancelHealthEventModal from "./components/CancelHealthEventModal";
import ReopenHealthEventModal from "./components/ReopenHealthEventModal";
import { formatLocalDatePtBR } from "../../utils/localDate";
import { HEALTH_EVENT_STATUS_LABELS, HEALTH_EVENT_TYPE_LABELS } from "./healthLabels";

export default function HealthEventDetailPage() {
  const { farmId, goatId, eventId } = useParams<{ farmId: string; goatId: string; eventId: string }>();
  const navigate = useNavigate();
  const { tokenPayload } = useAuth();

  const [event, setEvent] = useState<HealthEventResponseDTO | null>(null);
  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  const normalizeStatus = (value?: string | null) => {
    if (!value) return "";
    const withoutAccents = value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return withoutAccents.toUpperCase();
  };

  async function loadData() {
    if (!farmId || !goatId || !eventId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const goatPromise = fetchGoatById(Number(farmId), goatId).catch(() => null);
      const farmPromise = getGoatFarmById(Number(farmId)).catch(() => null);
      const eventPromise = healthAPI.getById(Number(farmId), goatId, Number(eventId)).catch((err) => {
        throw err;
      });

      const [, farmResult, eventData] = await Promise.all([goatPromise, farmPromise, eventPromise]);

      setEvent(eventData);
      setFarmData(farmResult);
    } catch (error: unknown) {
      const status = typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;

      if (status === 403) {
        toast.error("Acesso negado.");
      } else if (status === 404) {
        toast.error("Evento n\u00e3o encontrado.");
      } else {
        toast.error("Erro ao carregar detalhes do evento.");
      }

      setEvent(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [farmId, goatId, eventId, navigate]);

  const handleStatusChange = (action: "complete" | "cancel") => {
    if (action === "complete") {
      setShowCompletionModal(true);
    } else {
      setShowCancelModal(true);
    }
  };

  const handleComplete = async (data: HealthEventDoneRequestDTO) => {
    if (!event || !farmId || !goatId) return;

    try {
      await healthAPI.markAsDone(Number(farmId), goatId, event.id, data);
      toast.success("Evento realizado com sucesso!");
      setShowCompletionModal(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao marcar evento como realizado.");
    }
  };

  const handleCancel = async (data: HealthEventCancelRequestDTO) => {
    if (!event || !farmId || !goatId) return;

    try {
      await healthAPI.cancel(Number(farmId), goatId, event.id, data);
      toast.success("Evento cancelado com sucesso!");
      setShowCancelModal(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cancelar evento.");
    }
  };

  const handleReopen = async () => {
    if (!event || !farmId || !goatId) return;

    try {
      await healthAPI.reopen(Number(farmId), goatId, event.id);
      toast.success("Evento reaberto com sucesso!");
      setShowReopenModal(false);
      loadData();
    } catch (error: unknown) {
      console.error(error);
      const status = typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
      if (status === 403) {
        toast.error("Voc\u00ea n\u00e3o tem permiss\u00e3o para reabrir este evento.");
      } else {
        toast.error("Erro ao reabrir evento.");
      }
    }
  };

  const authorityList = tokenPayload?.authorities ?? [];
  const hasAuthority = (role: RoleEnum) => authorityList.includes(role);
  const normalizedStatus = normalizeStatus(event?.status);
  const fallbackStatus = event?.status || "UNKNOWN";
  const statusLabel = HEALTH_EVENT_STATUS_LABELS[fallbackStatus as HealthEventStatus]
    || HEALTH_EVENT_STATUS_LABELS[normalizedStatus as HealthEventStatus]
    || fallbackStatus;
  const statusClass = normalizedStatus
    ? normalizedStatus.toLowerCase()
    : fallbackStatus.toLowerCase ? fallbackStatus.toLowerCase() : "unknown";
  const isScheduled = normalizedStatus === HealthEventStatus.AGENDADO;

  const reopenAllowedStatuses: HealthEventStatus[] = [
    HealthEventStatus.REALIZADO,
    HealthEventStatus.CANCELADO,
  ];
  const isDoneOrCanceled = reopenAllowedStatuses.includes(normalizedStatus as HealthEventStatus);

  const isAdmin = hasAuthority(RoleEnum.ROLE_ADMIN);
  const isFarmOwnerRole = hasAuthority(RoleEnum.ROLE_FARM_OWNER);
  const isResourceOwner = Boolean(
    tokenPayload?.userId && farmData?.ownerId && tokenPayload.userId === farmData.ownerId,
  );
  const isFarmOwner = isFarmOwnerRole && isResourceOwner;
  const hasMilkWithdrawal = Boolean(event?.milkWithdrawalEndDate || event?.milkWithdrawalActive);
  const hasMeatWithdrawal = Boolean(event?.meatWithdrawalEndDate || event?.meatWithdrawalActive);

  const canReopen = (isAdmin || isFarmOwner) && isDoneOrCanceled;
  const showReopenButton = canReopen;

  if (loading) return <div className="page-loading">Carregando...</div>;

  if (!event) {
    return (
      <div className="module-empty">
        <div className="alert alert-warning">
          <h4>Evento n\u00e3o encontrado</h4>
          <p>N\u00e3o foi poss\u00edvel carregar os detalhes do evento.</p>
          <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="health-page">
      <div className="health-hero">
        <div className="health-hero__meta">
          <button className="health-btn health-btn-text mb-2" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <h1>Detalhes do evento</h1>
          <div className="health-status-badge-group mt-2">
            <span className={`health-status-badge health-status-badge--${statusClass}`}>
              {statusLabel}
            </span>
            {event.overdue && isScheduled && (
              <span className="health-overdue-badge">ATRASADO</span>
            )}
          </div>
        </div>
        <div className="health-hero__actions">
          {showReopenButton && (
            <button
              className="health-btn health-btn-warning"
              onClick={() => setShowReopenModal(true)}
            >
              <i className="fa-solid fa-rotate-left"></i> Reabrir
            </button>
          )}

          {isScheduled && (
            <>
              <button
                className="health-btn health-btn-primary"
                onClick={() => navigate("edit")}
                title="Editar evento"
              >
                <i className="fa-solid fa-pen"></i> Editar
              </button>
              <button
                className="health-btn health-btn-success"
                onClick={() => handleStatusChange("complete")}
                title="Marcar como realizado"
              >
                <i className="fa-solid fa-check"></i> Marcar realizado
              </button>
              <button
                className="health-btn health-btn-danger"
                onClick={() => handleStatusChange("cancel")}
                title="Cancelar evento"
              >
                <i className="fa-solid fa-ban"></i> Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="health-content-card">
        <div className="row g-4">
          <div className="col-md-6">
            <label className="text-muted small">Tipo</label>
            <div className="fw-bold fs-5">{HEALTH_EVENT_TYPE_LABELS[event.type as HealthEventType] || event.type}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted small">Data agendada</label>
            <div className="fw-bold fs-5">{formatLocalDatePtBR(event.scheduledDate)}</div>
          </div>

          <div className="col-12">
            <hr className="text-muted opacity-25" />
          </div>

          <div className="col-md-12">
            <label className="text-muted small">{"T\u00edtulo"}</label>
            <div className="fw-bold fs-5">{event.title}</div>
          </div>

          {event.description && (
            <div className="col-md-12">
              <label className="text-muted small">{"Descri\u00e7\u00e3o"}</label>
              <p className="mb-0">{event.description}</p>
            </div>
          )}

          {(event.productName || event.activeIngredient) && (
            <>
              <div className="col-12 mt-4"><h6 className="text-muted border-bottom pb-2">Detalhes do produto</h6></div>

              {event.productName && (
                <div className="col-md-6">
                  <label className="text-muted small">Produto</label>
                  <div className="fw-bold">{event.productName}</div>
                </div>
              )}
              {event.activeIngredient && (
                <div className="col-md-6">
                  <label className="text-muted small">{"Princ\u00edpio ativo"}</label>
                  <div className="fw-bold">{event.activeIngredient}</div>
                </div>
              )}
              {event.dose && (
                <div className="col-md-3">
                  <label className="text-muted small">Dose</label>
                  <div className="fw-bold">{event.dose} {event.doseUnit}</div>
                </div>
              )}
              {event.route && (
                <div className="col-md-3">
                  <label className="text-muted small">Via</label>
                  <div className="fw-bold">{event.route}</div>
                </div>
              )}
              {event.batchNumber && (
                <div className="col-md-6">
                  <label className="text-muted small">Lote</label>
                  <div className="fw-bold">{event.batchNumber}</div>
                </div>
              )}
              {event.withdrawalMilkDays !== undefined && (
                <div className="col-md-3">
                  <label className="text-muted small">{"Car\u00eancia do leite"}</label>
                  <div className="fw-bold">{event.withdrawalMilkDays} dias</div>
                </div>
              )}
              {event.withdrawalMeatDays !== undefined && (
                <div className="col-md-3">
                  <label className="text-muted small">{"Car\u00eancia da carne"}</label>
                  <div className="fw-bold">{event.withdrawalMeatDays} dias</div>
                </div>
              )}
              {hasMilkWithdrawal && (
                <div className="col-md-6">
                  <label className="text-muted small">{"Status car\u00eancia de leite"}</label>
                  <div className="fw-bold">
                    {event.milkWithdrawalActive ? "Ativa" : "Encerrada"}
                    {event.milkWithdrawalEndDate ? ` at\u00e9 ${formatLocalDatePtBR(event.milkWithdrawalEndDate)}` : ""}
                  </div>
                </div>
              )}
              {hasMeatWithdrawal && (
                <div className="col-md-6">
                  <label className="text-muted small">{"Status car\u00eancia de carne"}</label>
                  <div className="fw-bold">
                    {event.meatWithdrawalActive ? "Ativa" : "Encerrada"}
                    {event.meatWithdrawalEndDate ? ` at\u00e9 ${formatLocalDatePtBR(event.meatWithdrawalEndDate)}` : ""}
                  </div>
                </div>
              )}
            </>
          )}

          {normalizedStatus !== HealthEventStatus.AGENDADO && (
            <>
              <div className="col-12 mt-4"><h6 className="text-muted border-bottom pb-2">{"Execu\u00e7\u00e3o / Finaliza\u00e7\u00e3o"}</h6></div>
              {event.performedAt && (
                <div className="col-md-6">
                  <label className="text-muted small">{"Data de realiza\u00e7\u00e3o"}</label>
                  <div className="fw-bold">{new Date(event.performedAt).toLocaleString()}</div>
                </div>
              )}
              {event.responsible && (
                <div className="col-md-6">
                  <label className="text-muted small">{"Respons\u00e1vel"}</label>
                  <div className="fw-bold">{event.responsible}</div>
                </div>
              )}
            </>
          )}

          {event.notes && (
            <div className="col-md-12 mt-3">
              <label className="text-muted small">{"Observa\u00e7\u00f5es / Notas"}</label>
              <p className="mb-0 bg-light p-2 rounded">{event.notes}</p>
            </div>
          )}

          <div className="col-12 mt-5">
            <details>
              <summary className="text-muted small cursor-pointer">Dados brutos (debug)</summary>
              <pre className="bg-light p-2 mt-2 rounded small">
                {JSON.stringify(event, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>

      <DoneHealthEventModal
        isOpen={showCompletionModal}
        eventTitle={event?.title}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={handleComplete}
      />

      <CancelHealthEventModal
        isOpen={showCancelModal}
        eventTitle={event?.title}
        onClose={() => setShowCancelModal(false)}
        onConfirm={(notes) => handleCancel({ notes })}
      />

      <ReopenHealthEventModal
        isOpen={showReopenModal}
        eventTitle={event?.title}
        onClose={() => setShowReopenModal(false)}
        onConfirm={handleReopen}
      />
    </div>
  );
}
