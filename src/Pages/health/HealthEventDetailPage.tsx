import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { HealthEventResponseDTO, HealthEventType, HealthEventStatus, HealthEventDoneRequestDTO, HealthEventCancelRequestDTO } from "../../Models/HealthDTOs";
import "./healthPages.css";
import DoneHealthEventModal from "./components/DoneHealthEventModal";
import CancelHealthEventModal from "./components/CancelHealthEventModal";
import { formatLocalDatePtBR } from "../../utils/localDate";

export default function HealthEventDetailPage() {
  const { farmId, goatId, eventId } = useParams<{ farmId: string; goatId: string; eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<HealthEventResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const EVENT_TYPE_LABELS: Record<string, string> = {
    [HealthEventType.VACINA]: "Vacinação",
    [HealthEventType.VERMIFUGACAO]: "Vermifugação",
    [HealthEventType.MEDICACAO]: "Medicação",
    [HealthEventType.PROCEDIMENTO]: "Procedimento",
    [HealthEventType.DOENCA]: "Doença/Ocorrência",
  };

  const STATUS_LABELS: Record<string, string> = {
    [HealthEventStatus.AGENDADO]: "Agendado",
    [HealthEventStatus.REALIZADO]: "Realizado",
    [HealthEventStatus.CANCELADO]: "Cancelado"
  };

  async function loadData() {
    console.log("[HealthEventDetail] Loading data...", { farmId, goatId, eventId });
    
    if (!farmId || !goatId || !eventId) {
      console.error("[HealthEventDetail] Missing parameters");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Executa requisições em paralelo para maior eficiência e robustez
      // Assumimos que o goatId da URL é o ID correto para a API
      const goatPromise = fetchGoatById(Number(farmId), goatId)
        .catch(err => {
          console.error("Erro ao carregar cabra:", err);
          return null;
        });

      const eventPromise = healthAPI.getById(Number(farmId), goatId, Number(eventId))
        .catch(err => {
          console.error("Erro ao carregar evento:", err);
          throw err; // Re-throw para cair no catch principal se o evento falhar
        });

      const [goatData, eventData] = await Promise.all([goatPromise, eventPromise]);

      console.log("[HealthEventDetail] Data loaded:", { goat: goatData, event: eventData });
      
      // Se carregou o evento, sucesso!
      setEvent(eventData);
      
      // Cabra é opcional para exibir o evento, mas útil para o contexto
      // Se falhou ao carregar cabra, podemos tentar usar dados do evento se disponíveis, ou deixar null
    } catch (error) {
      console.error("[HealthEventDetail] Error loading data:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err.response?.status === 403) {
        toast.error("Acesso negado.");
      } else if (err.response?.status === 404) {
        toast.error("Evento não encontrado.");
      } else {
        toast.error("Erro ao carregar detalhes do evento.");
      }
      setEvent(null); // Garante estado limpo em erro
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [farmId, goatId, eventId, navigate]);

  const handleStatusChange = (action: 'complete' | 'cancel') => {
    if (action === 'complete') {
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

  if (loading) return <div className="page-loading">Carregando...</div>;
  
  if (!event) return (
    <div className="module-empty">
      <div className="alert alert-warning">
        <h4>Evento não encontrado</h4>
        <p>Não foi possível carregar os detalhes do evento.</p>
        <hr />
        <details>
          <summary>Informações de Debug</summary>
          <pre style={{ textAlign: 'left', fontSize: '0.8rem' }}>
            {JSON.stringify({ 
              farmId, 
              goatId, 
              eventId, 
              error: "Objeto de evento nulo após carregamento"
            }, null, 2)}
          </pre>
        </details>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    </div>
  );

  // Safe access helper
  const safeStatus = event.status || 'UNKNOWN';
  const statusLabel = STATUS_LABELS[safeStatus] || safeStatus;
  const statusClass = safeStatus.toLowerCase ? safeStatus.toLowerCase() : 'unknown';
  const isScheduled = safeStatus === HealthEventStatus.AGENDADO;
  const actionTooltip = isScheduled ? "" : "Somente eventos AGENDADOS podem ser alterados.";

  return (
    <div className="health-page">
      <div className="health-hero">
        <div className="health-hero__meta">
          <button className="health-btn health-btn-text mb-2" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <h1>Detalhes do Evento</h1>
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
          <button 
            className={`health-btn health-btn-primary ${!isScheduled ? 'health-btn--disabled' : ''}`}
            onClick={() => isScheduled && navigate("edit")}
            disabled={!isScheduled}
            title={actionTooltip}
          >
            <i className="fa-solid fa-pen"></i> Editar
          </button>
          <button 
            className={`health-btn health-btn-success ${!isScheduled ? 'health-btn--disabled' : ''}`}
            onClick={() => isScheduled && handleStatusChange('complete')}
            disabled={!isScheduled}
            title={actionTooltip}
          >
            <i className="fa-solid fa-check"></i> Marcar Realizado
          </button>
          <button 
            className={`health-btn health-btn-danger ${!isScheduled ? 'health-btn--disabled' : ''}`}
            onClick={() => isScheduled && handleStatusChange('cancel')}
            disabled={!isScheduled}
            title={actionTooltip}
          >
            <i className="fa-solid fa-ban"></i> Cancelar
          </button>
        </div>
      </div>

      <div className="health-content-card">
        <div className="row g-4">
            <div className="col-md-6">
                <label className="text-muted small">Tipo</label>
                <div className="fw-bold fs-5">{EVENT_TYPE_LABELS[event.type] || event.type}</div>
            </div>
            <div className="col-md-6">
                <label className="text-muted small">Data Agendada</label>
                <div className="fw-bold fs-5">{formatLocalDatePtBR(event.scheduledDate)}</div>
            </div>
            
            <div className="col-12">
                <hr className="text-muted opacity-25" />
            </div>

            <div className="col-md-12">
                <label className="text-muted small">Título</label>
                <div className="fw-bold fs-5">{event.title}</div>
            </div>

            {event.description && (
                <div className="col-md-12">
                    <label className="text-muted small">Descrição</label>
                    <p className="mb-0">{event.description}</p>
                </div>
            )}

            {/* Product Details Section */}
            {(event.productName || event.activeIngredient) && (
                <>
                    <div className="col-12 mt-4"><h6 className="text-muted border-bottom pb-2">Detalhes do Produto</h6></div>
                    
                    {event.productName && (
                        <div className="col-md-6">
                            <label className="text-muted small">Produto</label>
                            <div className="fw-bold">{event.productName}</div>
                        </div>
                    )}
                    {event.activeIngredient && (
                        <div className="col-md-6">
                            <label className="text-muted small">Princípio Ativo</label>
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
                            <label className="text-muted small">Carência Leite</label>
                            <div className="fw-bold">{event.withdrawalMilkDays} dias</div>
                        </div>
                    )}
                     {event.withdrawalMeatDays !== undefined && (
                        <div className="col-md-3">
                            <label className="text-muted small">Carência Carne</label>
                            <div className="fw-bold">{event.withdrawalMeatDays} dias</div>
                        </div>
                    )}
                </>
            )}

            {/* Execution Details */}
            {safeStatus !== HealthEventStatus.AGENDADO && (
                <>
                     <div className="col-12 mt-4"><h6 className="text-muted border-bottom pb-2">Execução / Finalização</h6></div>
                     {event.performedAt && (
                        <div className="col-md-6">
                            <label className="text-muted small">Data Realização</label>
                            <div className="fw-bold">{new Date(event.performedAt).toLocaleString()}</div>
                        </div>
                     )}
                     {event.responsible && (
                        <div className="col-md-6">
                            <label className="text-muted small">Responsável</label>
                            <div className="fw-bold">{event.responsible}</div>
                        </div>
                     )}
                </>
            )}

            {event.notes && (
                <div className="col-md-12 mt-3">
                    <label className="text-muted small">Observações / Notas</label>
                    <p className="mb-0 bg-light p-2 rounded">{event.notes}</p>
                </div>
            )}
            
            <div className="col-12 mt-5">
              <details>
                <summary className="text-muted small cursor-pointer">Dados Brutos (Debug)</summary>
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
    </div>
  );
}
