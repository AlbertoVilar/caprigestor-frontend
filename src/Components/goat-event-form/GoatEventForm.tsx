import { useState } from "react";
import { EventRequestDTO } from "../../Models/eventDTO";
import { createGoatEvent } from "../../api/EventsAPI/event";
import ButtonCard from "../buttons/ButtonCard"; // ✅ Importa botão reutilizável
import "./eventForm.css";

interface Props {
  goatId: string;
  onEventCreated?: () => void;
}

const eventTypes = [
  "COBERTURA",
  "PARTO",
  "MORTE",
  "SAUDE",
  "VACINACAO",
  "TRANSFERENCIA",
  "MUDANCA_PROPRIETARIO",
  "PESAGEM",
  "OUTRO",
];

export default function GoatEventForm({ goatId, onEventCreated }: Props) {
  const [formData, setFormData] = useState<EventRequestDTO>({
    goatId: goatId,
    eventType: "",
    date: "",
    description: "",
    location: "",
    veterinarian: "",
    outcome: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      await createGoatEvent(formData);
      setSuccessMessage("✅ Evento cadastrado com sucesso!");
      setFormData({
        ...formData,
        eventType: "",
        date: "",
        description: "",
        location: "",
        veterinarian: "",
        outcome: "",
      });
      onEventCreated?.();
    } catch (error) {
      console.error("Erro ao cadastrar evento:", error);
      setSuccessMessage("❌ Erro ao cadastrar evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <label>Tipo</label>
      <select
        name="eventType"
        value={formData.eventType}
        onChange={handleChange}
        required
      >
        <option value="">Selecione</option>
        {eventTypes.map((type) => (
          <option key={type} value={type}>
            {type.replaceAll("_", " ").toUpperCase()}
          </option>
        ))}
      </select>

      <label>Data</label>
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />

      <label>Descrição</label>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        required
      />

      <label>Local</label>
      <input
        type="text"
        name="location"
        value={formData.location}
        onChange={handleChange}
        required
      />

      <label>Veterinário</label>
      <input
        type="text"
        name="veterinarian"
        value={formData.veterinarian}
        onChange={handleChange}
      />

      <label>Resultado</label>
      <textarea
        name="outcome"
        value={formData.outcome}
        onChange={handleChange}
      />

      {/* ✅ Botão centralizado e padronizado */}
      <div className="submit-button-wrapper">
        <ButtonCard
          name={isSubmitting ? "Enviando..." : "Cadastrar Evento"}
          type="submit"
          className="submit"
        />
      </div>

      {successMessage && <p className="form-feedback">{successMessage}</p>}
    </form>
  );
}
