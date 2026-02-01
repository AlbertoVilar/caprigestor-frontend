import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { HealthEventResponseDTO, HealthEventType, HealthEventStatus } from "../../Models/HealthDTOs";
import "./healthPages.css";

export default function HealthEventDetailPage() {
  const { farmId, goatId, eventId } = useParams<{ farmId: string; goatId: string; eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<HealthEventResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (!farmId || !goatId || !eventId) return;
    try {
      setLoading(true);
      // We need goat internal ID to call health API
      // Since GoatActionPanel now passes the ID in URL, fetchGoatById should work
      const goatData = await fetchGoatById(Number(farmId), goatId);
      
      if (goatData && goatData.id) {
          const data = await healthAPI.getById(Number(farmId), goatData.id.toString(), Number(eventId));
          setEvent(data);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err.response?.status === 403) {
        toast.error("Acesso negado.");
        // navigate("/403"); 
      } else {
        console.error(error);
        toast.error("Erro ao carregar detalhes do evento.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [farmId, goatId, eventId, navigate]);

  const handleStatusChange = async (action: 'complete' | 'cancel') => {
    if (!event || !farmId || !goatId) return;
    
    try {
      // Need goat ID again - in a real app store this in context or state
      const goatData = await fetchGoatById(Number(farmId), goatId);
      if (!goatData || !goatData.id) return;

      if (action === 'complete') {
        const responsible = window.prompt("Nome do responsável:", "Veterinário/Operador");
        if (responsible === null) return;

        await healthAPI.markAsDone(Number(farmId), goatData.id.toString(), event.id, {
            performedAt: new Date().toISOString(),
            responsible: responsible,
            notes: "Realizado via detalhe do evento"
        });
        toast.success("Evento realizado!");
      } else {
        const reason = window.prompt("Motivo do cancelamento:");
        if (reason === null) return;

        await healthAPI.cancel(Number(farmId), goatData.id.toString(), event.id, {
            notes: reason
        });
        toast.success("Evento cancelado!");
      }
      
      loadData(); // Reload to see updates
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status.");
    }
  };

  if (loading) return <div className="page-loading">Carregando...</div>;
  if (!event) return <div className="module-empty">Evento não encontrado.</div>;

  return (
    <div className="health-page">
      <div className="health-header">
        <div className="health-header__content">
          <button className="btn-text mb-2" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <h2>Detalhes do Evento</h2>
          <span className={`status-badge status-${event.status.toLowerCase()} mt-2`}>
            {STATUS_LABELS[event.status] || event.status}
          </span>
        </div>
        <div className="health-actions">
           {event.status === HealthEventStatus.AGENDADO && (
             <>
                <button className="btn-primary" onClick={() => navigate("edit")}>
                  <i className="fa-solid fa-pen"></i> Editar
                </button>
                <button className="btn-success text-white" onClick={() => handleStatusChange('complete')}>
                  <i className="fa-solid fa-check"></i> Marcar Realizado
                </button>
                <button className="btn-danger text-white" onClick={() => handleStatusChange('cancel')}>
                  <i className="fa-solid fa-ban"></i> Cancelar
                </button>
             </>
           )}
        </div>
      </div>

      <div className="module-hero" style={{ background: 'white' }}>
        <div className="row g-4">
            <div className="col-md-6">
                <label className="text-muted small">Tipo</label>
                <div className="fw-bold fs-5">{EVENT_TYPE_LABELS[event.type] || event.type}</div>
            </div>
            <div className="col-md-6">
                <label className="text-muted small">Data Agendada</label>
                <div className="fw-bold fs-5">{new Date(event.scheduledDate).toLocaleDateString()}</div>
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
            {event.status !== HealthEventStatus.AGENDADO && (
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

        </div>
      </div>
    </div>
  );
}
