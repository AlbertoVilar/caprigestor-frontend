import { useEffect, useState } from "react";
import { EventResponseDTO } from "../../Models/eventDTO";
import { getGoatEvents, deleteEvent } from "../../api/EventsAPI/event";
import ModalEventDetails from "../events/event-datails/ModalEventDetails";
import ModalEventEdit from "../events/ModalEventEdit";
import { FaSearch, FaTrash, FaEdit } from "react-icons/fa";
import "./events.css";

interface Props {
  registrationNumber: string;
}

export default function GoatEventList({ registrationNumber }: Props) {
  // Estado para armazenar eventos do animal
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para controlar os modais
  const [selectedEvent, setSelectedEvent] = useState<EventResponseDTO | null>(null); // Detalhes
  const [editEvent, setEditEvent] = useState<EventResponseDTO | null>(null);         // Edição

  // Função que busca os eventos do animal
  const fetchEvents = () => {
    getGoatEvents(registrationNumber)
      .then(setEvents)
      .catch((err) => console.error("Erro ao buscar eventos:", err))
      .finally(() => setLoading(false));
  };

  // Carrega eventos sempre que o número de registro mudar
  useEffect(() => {
    if (registrationNumber) {
      fetchEvents();
    }
  }, [registrationNumber]);

  // Modal de detalhes
  const openDetailsModal = (event: EventResponseDTO) => setSelectedEvent(event);
  const closeDetailsModal = () => setSelectedEvent(null);

  // Modal de edição
  const openEditModal = (event: EventResponseDTO) => setEditEvent(event);
  const closeEditModal = () => setEditEvent(null);

  // Exclusão com confirmação
  const handleDelete = async (event: EventResponseDTO) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este evento?");
    if (!confirmDelete) return;

    try {
      await deleteEvent(event.goatId, event.id);
      // Remove da lista atual sem recarregar tudo
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
      alert("Erro ao excluir o evento.");
    }
  };

  // Renderização condicional
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
                {/* Ações: ver mais, editar e excluir */}
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

      {/* Modal de detalhes */}
      {selectedEvent && (
        <ModalEventDetails event={selectedEvent} onClose={closeDetailsModal} />
      )}

      {/* Modal de edição */}
      {editEvent && (
        <ModalEventEdit
          event={editEvent}
          onClose={closeEditModal}
          onEventUpdated={fetchEvents}
        />
      )}
    </div>
  );
}
