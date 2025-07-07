import GoatEventForm from "./GoatEventForm";
import "./eventModal.css";

interface Props {
  goatId: string;
  onClose: () => void;
  onEventCreated: () => void;
}

export default function GoatEventModal({ goatId, onClose, onEventCreated }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <span>➕ Novo Evento</span>
          <button className="modal-close" onClick={onClose}>✖</button>
        </div>

        <div className="modal-body">
          <GoatEventForm goatId={goatId} onEventCreated={onEventCreated} />
        </div>

        <div className="modal-footer">
          {/* O botão de envio do form já está dentro do GoatEventForm */}
        </div>
      </div>
    </div>
  );
}
