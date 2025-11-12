import { useEffect, useState } from "react";
import { EventResponseDTO } from "../../Models/eventDTO";
import { getGoatEvents, deleteEvent } from "../../api/EventsAPI/event";
import ModalEventDetails from "./event-datails/ModalEventDetails";
import ModalEventEdit from "./ModalEventEdit";
import { FaSearch, FaTrash, FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";

import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import "./events.css";

interface Props {
  registrationNumber: string;
  farmId: number;
  filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default function GoatEventList({ registrationNumber, farmId, filters }: Props) {
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventResponseDTO | null>(null);
  const [editEvent, setEditEvent] = useState<EventResponseDTO | null>(null);

  const fetchEvents = () => {
    console.log("🔍 Buscando eventos para:", registrationNumber, "com filtros:", filters);
    setLoading(true);
    getGoatEvents(farmId, registrationNumber, filters)
      .then((data) => {
        console.log("🔍 DEBUG - Eventos retornados pela API:", data);
        
        // Filtrar eventos com IDs válidos
        const validEvents = data.filter((event, index) => {
          console.log(`🔍 DEBUG - Evento ${index}:`, {
            id: event.id,
            idType: typeof event.id,
            goatId: event.goatId,
            eventType: event.eventType,
            isValidId: event.id !== null && event.id !== undefined && !isNaN(Number(event.id))
          });
          
          const isValid = event.id !== null && event.id !== undefined && !isNaN(Number(event.id));
          if (!isValid) {
            console.warn(`⚠️ AVISO - Evento com ID inválido filtrado:`, event);
          }
          return isValid;
        });
        
        console.log(`🔍 DEBUG - Total de eventos: ${data.length}, Eventos válidos: ${validEvents.length}`);
        setEvents(validEvents);
      })
      .catch((err) => {
        console.error("❌ Erro ao buscar eventos:", err);
        toast.error("Erro ao carregar eventos: " + err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (registrationNumber && farmId != null) {
      fetchEvents();
    }
  }, [registrationNumber, farmId, filters]); // ✅ Recarrega ao mudar filtros

  const openDetailsModal = (event: EventResponseDTO) => setSelectedEvent(event);
  const closeDetailsModal = () => setSelectedEvent(null);
  const openEditModal = (event: EventResponseDTO) => {
    console.log("🔍 DEBUG - Abrindo modal de edição com evento:", {
      id: event.id,
      idType: typeof event.id,
      goatId: event.goatId,
      eventType: event.eventType,
      fullEvent: event
    });
    setEditEvent(event);
  };
  const closeEditModal = () => setEditEvent(null);

  const handleDelete = (event: EventResponseDTO) => {
    console.log("🔍 DEBUG - Tentando deletar evento:", {
      id: event.id,
      idType: typeof event.id,
      goatId: event.goatId,
      eventType: event.eventType
    });

    // Validação mais robusta do ID
    if (!event.id || event.id === null || event.id === undefined || isNaN(Number(event.id))) {
      console.error("❌ ERRO - ID do evento é inválido:", event.id);
      toast.error("Erro: ID do evento é inválido. Não é possível excluir.");
      return;
    }

    confirmAlert({
      title: "Confirmar exclusão",
      message: `Tem certeza que deseja excluir o evento "${event.eventType}"?`,
      buttons: [
        {
          label: "Sim",
          onClick: () => {
            console.log("🔍 DEBUG - Chamando deleteEvent com:", {
              farmId,
              goatId: event.goatId,
              eventId: event.id
            });

            deleteEvent(farmId, event.goatId, event.id)
              .then(() => {
                toast.success("Evento excluído com sucesso!");
                fetchEvents();
              })
              .catch((err) => {
                console.error("Erro ao excluir evento:", err);
                toast.error("Erro ao excluir evento.");
              });
          }
        },
        {
          label: "Não",
          onClick: () => {}
        }
      ]
    });
  };

  if (loading) return <p>Carregando eventos...</p>;
  if (events.length === 0) return <p>Nenhum evento encontrado.</p>;

  return (
    <div className="event-table">
      <h3>Eventos do animal</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Local</th>
            <th>Veterinário</th>
            <th>Resultado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{new Date(event.date).toLocaleDateString("pt-BR")}</td>
              <td>{event.eventType}</td>
              <td>{event.description.slice(0, 30)}...</td>
              <td>{event.location}</td>
              <td>{event.veterinarian}</td>
              <td>{event.outcome.slice(0, 30)}...</td>
              <td>
                <FaSearch
                  title="Ver detalhes"
                  className="action-icon icon-view"
                  onClick={() => openDetailsModal(event)}
                />
                <FaEdit
                  title="Editar evento"
                  className="action-icon icon-edit"
                  onClick={() => openEditModal(event)}
                />
                <FaTrash
                  title="Excluir evento"
                  className="action-icon icon-delete"
                  onClick={() => handleDelete(event)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedEvent && (
        <ModalEventDetails event={selectedEvent} onClose={closeDetailsModal} />
      )}

      {editEvent && (
        <ModalEventEdit
          event={editEvent}
          farmId={farmId}
          onClose={closeEditModal}
          onEventUpdated={() => {
            fetchEvents();
            toast.success("Evento atualizado com sucesso!");
          }}
        />
      )}
    </div>
  );
}
