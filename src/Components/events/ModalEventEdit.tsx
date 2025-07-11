import { useState } from "react";
import type { EventRequestDTO, EventResponseDTO } from "../../Models/eventDTO";
import { updateEvent } from "../../api/EventsAPI/event";
import "../events/modalEventEdit.css";

interface Props {
  event: EventResponseDTO;
  onClose: () => void;
  onEventUpdated: () => void;
}

export default function ModalEventEdit({ event, onClose, onEventUpdated }: Props) {
  const [formData, setFormData] = useState<EventRequestDTO>({
    goatId: event.goatId, // goatId agora vem do ResponseDTO corretamente
    date: event.date,
    eventType: event.eventType,
    description: event.description,
    location: event.location,
    veterinarian: event.veterinarian,
    outcome: event.outcome,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEvent(event.goatId, event.id, formData); // ✅ Correção aqui
      onEventUpdated();
      onClose();
    } catch (err) {
      console.error("Erro ao atualizar evento:", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>✖</button>
        <h2>Editar Evento</h2>
        <form onSubmit={handleSubmit}>
          <label>Data:
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </label>
          <label>Tipo:
            <input type="text" name="eventType" value={formData.eventType} onChange={handleChange} required />
          </label>
          <label>Descrição:
            <textarea name="description" value={formData.description} onChange={handleChange} required />
          </label>
          <label>Local:
            <input type="text" name="location" value={formData.location} onChange={handleChange} />
          </label>
          <label>Veterinário:
            <input type="text" name="veterinarian" value={formData.veterinarian} onChange={handleChange} />
          </label>
          <label>Resultado:
            <textarea name="outcome" value={formData.outcome} onChange={handleChange} />
          </label>
          <button type="submit" className="btn-submit">Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}
