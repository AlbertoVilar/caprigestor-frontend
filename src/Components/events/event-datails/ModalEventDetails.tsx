import "./modalEventDetails.css";
import type { EventResponseDTO } from "../../../Models/eventDTO";

interface Props {
  event: EventResponseDTO;
  onClose: () => void;
}

export default function ModalEventDetails({ event, onClose }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal-content event-details-modal">
        <button className="modal-close-btn" onClick={onClose}>
          &#x2715;
        </button>
        <h2 className="modal-title">Detalhes do Evento</h2>

        <div className="event-detail-line">
          <strong>Data:</strong> {event.date}
        </div>
        <div className="event-detail-line">
          <strong>Tipo:</strong> {event.eventType}
        </div>
        <div className="event-detail-line">
          <strong>Descrição:</strong> {event.description}
        </div>
        <div className="event-detail-line">
          <strong>Local:</strong> {event.location}
        </div>
        <div className="event-detail-line">
          <strong>Veterinário:</strong> {event.veterinarian}
        </div>
        <div className="event-detail-line">
          <strong>Resultado:</strong> {event.outcome}
        </div>
      </div>
    </div>
  );
}
