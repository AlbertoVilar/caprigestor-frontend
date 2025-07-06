// src/Components/events/GoatEventList.tsx

import { useEffect, useState } from "react";
import { EventResponseDTO } from "../../Models/eventDTO";
import { getGoatEvents } from "../../api/EventsAPI/event";
import "./events.css";

interface Props {
  registrationNumber: string;
}

export default function GoatEventList({ registrationNumber }: Props) {
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (registrationNumber) {
      getGoatEvents(registrationNumber)
        .then(setEvents)
        .catch((err) => console.error("Erro ao buscar eventos:", err))
        .finally(() => setLoading(false));
    }
  }, [registrationNumber]);

  const toggleExpand = (id: number, type: "description" | "outcome") => {
    if (type === "description") {
      setExpandedDescriptions((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    } else {
      setExpandedOutcomes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    }
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
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{new Date(event.date).toLocaleDateString("pt-BR")}</td>
              <td>{event.eventType}</td>

              {/* Descrição */}
              <td>
                {expandedDescriptions.has(event.id) || event.description.length <= 60
                  ? event.description
                  : `${event.description.slice(0, 60)}... `}
                {event.description.length > 60 && (
                  <button
                    onClick={() => toggleExpand(event.id, "description")}
                    className="btn-link"
                  >
                    {expandedDescriptions.has(event.id) ? "Ver menos" : "Ler mais"}
                  </button>
                )}
              </td>

              <td>{event.location}</td>
              <td>{event.veterinarian}</td>

              {/* Resultado */}
              <td>
                {expandedOutcomes.has(event.id) || event.outcome.length <= 60
                  ? event.outcome
                  : `${event.outcome.slice(0, 60)}... `}
                {event.outcome.length > 60 && (
                  <button
                    onClick={() => toggleExpand(event.id, "outcome")}
                    className="btn-link"
                  >
                    {expandedOutcomes.has(event.id) ? "Ver menos" : "Ler mais"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
