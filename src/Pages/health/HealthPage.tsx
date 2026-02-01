import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { fetchGoatByFarmAndRegistration } from "../../api/GoatAPI/goat";
import { HealthEventDTO, HealthEventType, HealthEventStatus } from "../../Models/HealthDTOs";
import { GoatResponseDTO } from "../../Models/goatResponseDTO";
import "./healthPages.css";
import "../../index.css";

const EVENT_TYPE_LABELS: Record<string, string> = {
  [HealthEventType.VACCINE]: "Vacinação",
  [HealthEventType.EXAM]: "Exame",
  [HealthEventType.ILLNESS]: "Doença",
  [HealthEventType.TREATMENT]: "Tratamento",
  [HealthEventType.HOOF_TRIMMING]: "Casqueamento",
  [HealthEventType.DEWORMING]: "Vermifugação",
};

const STATUS_LABELS: Record<string, string> = {
  [HealthEventStatus.SCHEDULED]: "Agendado",
  [HealthEventStatus.COMPLETED]: "Realizado",
  [HealthEventStatus.CANCELLED]: "Cancelado",
};

export default function HealthPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [events, setEvents] = useState<HealthEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    type: "",
    status: "",
  });

  useEffect(() => {
    async function loadData() {
      if (!farmId || !goatId) return;
  
      try {
        setLoading(true);
        const [goatData] = await Promise.all([
          fetchGoatByFarmAndRegistration(Number(farmId), goatId),
        ]);
  
        setGoat(goatData);
        
        if (goatData && goatData.id) {
           const realEvents = await healthAPI.listByGoat(Number(farmId), goatData.id);
           setEvents(realEvents);
        }
  
      } catch (error) {
        console.error("Erro ao carregar dados de saúde:", error);
        toast.error("Erro ao carregar dados. Verifique a conexão.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [farmId, goatId]);


  const filteredEvents = events.filter(event => {
    if (filters.type && event.eventType !== filters.type) return false;
    if (filters.status && event.status !== filters.status) return false;
    return true;
  });

  const handleDelete = async (eventId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este evento?")) return;
    
    try {
      await healthAPI.delete(Number(farmId), eventId);
      toast.success("Evento excluído com sucesso!");
      // Reload logic - could be extracted but keeping simple for now
      if (goat && goat.id) {
          const realEvents = await healthAPI.listByGoat(Number(farmId), goat.id);
          setEvents(realEvents);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir evento.");
    }
  };

  const handleComplete = async (eventId: number) => {
    try {
      await healthAPI.complete(Number(farmId), eventId);
      toast.success("Evento marcado como realizado!");
      if (goat && goat.id) {
          const realEvents = await healthAPI.listByGoat(Number(farmId), goat.id);
          setEvents(realEvents);
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
              <th>Data</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.date).toLocaleDateString()}</td>
                  <td>
                    <span className="type-badge">
                      {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                    </span>
                  </td>
                  <td>
                    <div className="fw-bold">{event.description || "-"}</div>
                    {event.vaccineName && <small className="text-muted d-block">Vacina: {event.vaccineName}</small>}
                    {event.illnessName && <small className="text-muted d-block">Doença: {event.illnessName}</small>}
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
                      
                      {event.status === HealthEventStatus.SCHEDULED && (
                        <>
                          <button 
                            className="icon-btn" 
                            title="Editar"
                            onClick={() => navigate(`${event.id}/edit`)}
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
                        </>
                      )}
                      
                      <button 
                        className="icon-btn delete" 
                        title="Excluir"
                        onClick={() => handleDelete(event.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
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
