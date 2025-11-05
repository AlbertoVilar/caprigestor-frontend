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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔍 DEBUG - Tentando atualizar evento:", {
      eventId: event.id,
      idType: typeof event.id,
      goatId: event.goatId,
      goatIdType: typeof event.goatId,
      fullEvent: event,
      formData: formData
    });

    // Validação mais robusta do ID
     if (!event.id || event.id === null || event.id === undefined || isNaN(Number(event.id))) {
       console.error("❌ ERRO - ID do evento é inválido:", event.id);
       toast.error("Erro: ID do evento é inválido. Não é possível atualizar.");
       return;
     }

     // Validação do goatId
     if (!event.goatId || event.goatId === null || event.goatId === undefined) {
       console.error("❌ ERRO - ID da cabra é inválido:", event.goatId);
       toast.error("Erro: ID da cabra é inválido. Não é possível atualizar.");
       return;
     }

     console.log("🔍 DEBUG - Chamando updateEvent com:", {
       farmId,
       goatId: event.goatId,
       eventId: event.id,
       eventData: formData
     });

     updateEvent(farmId, event.goatId, event.id, formData)
       .then(() => {
         toast.success("Evento atualizado com sucesso!");
         onClose();
         onEventUpdated();
       })
       .catch((err) => {
         console.error("Erro ao atualizar evento:", err);
         toast.error("Erro ao atualizar evento.");
       });
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
