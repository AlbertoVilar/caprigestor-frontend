import { EventRequestDTO, EventResponseDTO } from "../../Models/eventDTO";
import { BASE_URL } from "../../utils/apiConfig"; // ✅ use a URL padronizada

// ✅ Buscar eventos da cabra (GET)
export async function getGoatEvents(registrationNumber: string): Promise<EventResponseDTO[]> {
  const response = await fetch(`${BASE_URL}/goats/${registrationNumber}/events`);

  if (!response.ok) {
    throw new Error("Erro ao buscar eventos da cabra.");
  }

  const data = await response.json();
  return data.content; // ✅ porque é paginado
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
