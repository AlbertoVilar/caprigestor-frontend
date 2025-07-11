import { useEffect, useState } from "react";
import { EventResponseDTO } from "../../Models/eventDTO";
import { getGoatEvents } from "../../api/EventsAPI/event";
import ModalEventDetails from "../events/event-datails/ModalEventDetails";
import ModalEventEdit from "../events/ModalEventEdit";
import { FaSearch, FaTrash, FaEdit } from "react-icons/fa";
import "./events.css";

interface Props {
  registrationNumber: string;
}

export default function GoatEventList({ registrationNumber }: Props) {
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventResponseDTO | null>(
    null
  );
  const [editEvent, setEditEvent] = useState<EventResponseDTO | null>(null);

  const fetchEvents = () => {
    getGoatEvents(registrationNumber)
      .then(setEvents)
      .catch((err) => console.error("Erro ao buscar eventos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (registrationNumber) {
      fetchEvents();
    }
  }, [registrationNumber]);

  const openDetailsModal = (event: EventResponseDTO) => setSelectedEvent(event);
  const closeDetailsModal = () => setSelectedEvent(null);

  const openEditModal = (event: EventResponseDTO) => setEditEvent(event);
  const closeEditModal = () => setEditEvent(null);

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
                  onClick={() => console.log("Excluir", event)}
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
