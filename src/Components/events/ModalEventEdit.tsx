import { useState } from "react";
import { toast } from "react-toastify";
import type { EventRequestDTO, EventResponseDTO } from "../../Models/eventDTO";
import { updateEvent } from "../../api/EventsAPI/event";
import "../events/modalEventEdit.css";

interface Props {
  event: EventResponseDTO;
  farmId: number;
  onClose: () => void;
  onEventUpdated: () => void;
}

export default function ModalEventEdit({ event, farmId, onClose, onEventUpdated }: Props) {
  const [formData, setFormData] = useState<EventRequestDTO>({
    goatId: event.goatId,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!event.id || event.id === null || event.id === undefined || isNaN(Number(event.id))) {
      console.error("ID do evento inválido:", event.id);
      toast.error("Não foi possível atualizar este evento. Atualize a lista e tente novamente.");
      return;
    }

    if (!event.goatId || event.goatId === null || event.goatId === undefined) {
      console.error("ID da cabra inválido:", event.goatId);
      toast.error("Não foi possível identificar o animal deste evento.");
      return;
    }

    updateEvent(farmId, event.goatId, event.id, formData)
      .then(() => {
        toast.success("Evento atualizado com sucesso!");
        onClose();
        onEventUpdated();
      })
      .catch((err) => {
        console.error("Erro ao atualizar evento:", err);
        toast.error("Não foi possível atualizar o evento.");
      });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>
        <h2>Editar Evento</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Data:
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </label>
          <label>
            Tipo:
            <input
              type="text"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Descrição:
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Local:
            <input type="text" name="location" value={formData.location} onChange={handleChange} />
          </label>
          <label>
            Veterinário:
            <input
              type="text"
              name="veterinarian"
              value={formData.veterinarian}
              onChange={handleChange}
            />
          </label>
          <label>
            Resultado:
            <textarea name="outcome" value={formData.outcome} onChange={handleChange} />
          </label>
          <button type="submit" className="btn-submit">
            Salvar alterações
          </button>
        </form>
      </div>
    </div>
  );
}
