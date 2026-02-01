import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { HealthEventDTO, HealthEventType, HealthEventStatus } from "../../Models/HealthDTOs";
import "./healthPages.css";

const EVENT_TYPE_LABELS: Record<string, string> = {
  [HealthEventType.VACCINE]: "Vacinação",
  [HealthEventType.EXAM]: "Exame",
  [HealthEventType.ILLNESS]: "Doença",
  [HealthEventType.TREATMENT]: "Tratamento",
  [HealthEventType.HOOF_TRIMMING]: "Casqueamento",
  [HealthEventType.DEWORMING]: "Vermifugação",
};

export default function HealthEventDetailPage() {
  const { farmId, eventId } = useParams<{ farmId: string; goatId: string; eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<HealthEventDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!farmId || !eventId) return;
      try {
        setLoading(true);
        const data = await healthAPI.getById(Number(farmId), Number(eventId));
        setEvent(data);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        if (err.response?.status === 403) {
          toast.error("Acesso negado.");
          navigate("/403");
        } else {
          console.error(error);
          toast.error("Erro ao carregar detalhes do evento.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [farmId, eventId, navigate]);

  const handleStatusChange = async (action: 'complete' | 'cancel') => {
    if (!event || !farmId) return;
    try {
      if (action === 'complete') {
        await healthAPI.complete(Number(farmId), event.id);
        toast.success("Evento realizado!");
      } else {
        await healthAPI.cancel(Number(farmId), event.id);
        toast.success("Evento cancelado!");
      }
      // Re-load data
      const data = await healthAPI.getById(Number(farmId), Number(eventId));
      setEvent(data);
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
            {event.status}
          </span>
        </div>
        <div className="health-actions">
           {event.status === HealthEventStatus.SCHEDULED && (
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
                <div className="fw-bold fs-5">{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</div>
            </div>
            <div className="col-md-6">
                <label className="text-muted small">Data</label>
                <div className="fw-bold fs-5">{new Date(event.date).toLocaleDateString()}</div>
            </div>
            
            <div className="col-12">
                <hr className="text-muted opacity-25" />
            </div>

            <div className="col-md-12">
                <label className="text-muted small">Descrição</label>
                <p className="mb-0">{event.description || "-"}</p>
            </div>

            {event.vaccineName && (
                <div className="col-md-6">
                    <label className="text-muted small">Vacina</label>
                    <div className="fw-bold">{event.vaccineName}</div>
                </div>
            )}

            {event.batchNumber && (
                <div className="col-md-6">
                    <label className="text-muted small">Lote</label>
                    <div className="fw-bold">{event.batchNumber}</div>
                </div>
            )}

            {event.illnessName && (
                <div className="col-md-6">
                    <label className="text-muted small">Doença</label>
                    <div className="fw-bold">{event.illnessName}</div>
                </div>
            )}

            {event.treatmentDetails && (
                <div className="col-md-12">
                    <label className="text-muted small">Detalhes do Tratamento</label>
                    <p className="mb-0">{event.treatmentDetails}</p>
                </div>
            )}

            <div className="col-md-6">
                <label className="text-muted small">Responsável</label>
                <div>{event.performer || "-"}</div>
            </div>

            <div className="col-md-6">
                <label className="text-muted small">Custo</label>
                <div>{event.cost ? `R$ ${event.cost.toFixed(2)}` : "-"}</div>
            </div>
        </div>
      </div>
    </div>
  );
}
