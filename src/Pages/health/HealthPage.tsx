import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { HealthEventResponseDTO, HealthEventType, HealthEventStatus } from "../../Models/HealthDTOs";
import { GoatResponseDTO } from "../../Models/goatResponseDTO";
import "./healthPages.css";
import "../../index.css";

const EVENT_TYPE_LABELS: Record<string, string> = {
  [HealthEventType.VACINA]: "Vacina",
  [HealthEventType.VERMIFUGACAO]: "Vermifugação",
  [HealthEventType.MEDICACAO]: "Medicação",
  [HealthEventType.PROCEDIMENTO]: "Procedimento",
  [HealthEventType.DOENCA]: "Doença/Ocorrência"
};

const STATUS_LABELS: Record<string, string> = {
  [HealthEventStatus.AGENDADO]: "Agendado",
  [HealthEventStatus.REALIZADO]: "Realizado",
  [HealthEventStatus.CANCELADO]: "Cancelado"
};

export default function HealthPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [events, setEvents] = useState<HealthEventResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    type: "",
    status: "",
  });

  async function loadData() {
    if (!farmId || !goatId) return;

    try {
      setLoading(true);
      // Fetch goat details using ID from URL (provided by GoatActionPanel)
      const goatData = await fetchGoatById(Number(farmId), goatId);
      setGoat(goatData);
      
      if (goatData && goatData.id) {
         // Backend accepts goatId as String in path variable.
         // Previous code used ID. Let's use ID to be safe and consistent with previous working version.
         const response = await healthAPI.listByGoat(Number(farmId), goatData.id.toString());
         // Response is Page<HealthEventResponseDTO>
         if (response && response.content) {
            setEvents(response.content);
         } else {
            setEvents([]);
         }
      }

    } catch (error) {
      console.error("Erro ao carregar dados de saúde:", error);
      toast.error("Erro ao carregar dados. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [farmId, goatId]);


  const filteredEvents = events.filter(event => {
    if (filters.type && event.type !== filters.type) return false;
    if (filters.status && event.status !== filters.status) return false;
    return true;
  });

  const handleCancel = async (eventId: number) => {
    const reason = window.prompt("Motivo do cancelamento:");
    if (reason === null) return; // Cancelled prompt
    
    try {
      if (goat && goat.id) {
        await healthAPI.cancel(Number(farmId), goat.id.toString(), eventId, { notes: reason });
        toast.success("Evento cancelado com sucesso!");
        loadData();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cancelar evento.");
    }
  };

  const handleComplete = async (eventId: number) => {
    // Simple completion for now. In a real app, maybe show a modal to input 'performedAt' etc.
    // For now, assume "now" and current user (frontend doesn't track user name easily here without context, 
    // but let's send a placeholder or prompt).
    
    // The done DTO requires: performedAt, responsible, notes(optional)
    const responsible = window.prompt("Nome do responsável:", "Veterinário/Operador");
    if (responsible === null) return;

    try {
        if (goat && goat.id) {
            await healthAPI.markAsDone(Number(farmId), goat.id.toString(), eventId, {
                performedAt: new Date().toISOString(),
                responsible: responsible,
                notes: "Realizado via sistema web"
            });
            toast.success("Evento marcado como realizado!");
            loadData();
        }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status.");
    }
  };

  if (loading) {
    return <div className="page-loading"><i className="fa-solid fa-spinner fa-spin"></i> Carregando...</div>;
  }

  return (
    <div className="health-page">
      <div className="health-header">
        <div className="health-header__content">
          <button className="btn-text mb-2" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <h2>Controle Sanitário</h2>
          <p>Animal: <strong>{goat?.name}</strong> (Reg: {goat?.registrationNumber})</p>
        </div>
        <div className="health-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate("new")}
          >
            <i className="fa-solid fa-plus"></i> Novo Evento
          </button>
        </div>
      </div>

      <div className="health-filters">
        <div className="filter-group">
          <label>Tipo de Evento</label>
          <select 
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="">Todos</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="health-table-container">
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
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.scheduledDate).toLocaleDateString()}</td>
                  <td>
                    <span className="type-badge">
                      {EVENT_TYPE_LABELS[event.type] || event.type}
                    </span>
                  </td>
                  <td>
                    <div className="fw-bold">{event.title}</div>
                    {event.productName && <small className="text-muted d-block">Produto: {event.productName}</small>}
                  </td>
                  <td>
                    <span className={`status-badge status-${event.status.toLowerCase()}`}>
                      {STATUS_LABELS[event.status] || event.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btn-group">
                      <button 
                        className="icon-btn" 
                        title="Ver Detalhes"
                        onClick={() => navigate(`${event.id}`)}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      
                      {event.status === HealthEventStatus.AGENDADO && (
                        <>
                          <button 
                            className="icon-btn" 
                            title="Editar"
                            onClick={() => navigate(`${event.id}/edit`)} // Assuming edit page is supported or we reuse form
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button 
                            className="icon-btn text-success" 
                            title="Marcar como Realizado"
                            onClick={() => handleComplete(event.id)}
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button 
                            className="icon-btn text-danger" 
                            title="Cancelar"
                            onClick={() => handleCancel(event.id)}
                          >
                            <i className="fa-solid fa-ban"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  Nenhum evento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
