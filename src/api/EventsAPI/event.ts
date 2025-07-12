import { EventRequestDTO, EventResponseDTO } from "../../Models/eventDTO";
import { BASE_URL } from "../../utils/apiConfig";

// ✅ Buscar eventos da cabra (GET)
export async function getGoatEvents(registrationNumber: string): Promise<EventResponseDTO[]> {
  const response = await fetch(`${BASE_URL}/goats/${registrationNumber}/events`);

  if (!response.ok) {
    throw new Error("Erro ao buscar eventos da cabra.");
  }

  const data = await response.json();
  return data.content; // ✅ porque a resposta é paginada
}

// ✅ Criar novo evento da cabra (POST)
export async function createGoatEvent(event: EventRequestDTO): Promise<void> {
  const response = await fetch(`${BASE_URL}/goats/${event.goatId}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error("Erro ao criar evento da cabra.");
  }
}

// ✅ Atualizar evento existente da cabra (PUT)
export async function updateEvent(goatId: string, id: number, event: EventRequestDTO): Promise<void> {
  const response = await fetch(`${BASE_URL}/goats/${goatId}/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error("Erro ao atualizar o evento");
  }
}

// Excluir evento (Delete)
export async function deleteEvent(goatId: string, eventId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/goats/${goatId}/events/${eventId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Erro ao excluir o evento");
  }
}

