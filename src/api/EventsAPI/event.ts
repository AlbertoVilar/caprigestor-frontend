import { EventRequestDTO, EventResponseDTO } from "../../Models/eventDTO";
import { BASE_URL } from "../../utils/apiConfig";
import { requestBackEnd } from "../../utils/request";

interface Filters {
  type?: string; // Usamos 'type' no frontend, mas vamos converter para 'eventType' no backend
  startDate?: string;
  endDate?: string;
}

// ✅ Buscar eventos da cabra com filtros (GET)
export async function getGoatEvents(
  registrationNumber: string,
  filters?: Filters
): Promise<EventResponseDTO[]> {
  const url = new URL(`${BASE_URL}/goats/${registrationNumber}/events`);

  // 🔁 Converte 'type' do frontend para 'eventType' usado no backend
  if (filters?.type) url.searchParams.append("eventType", filters.type);
  if (filters?.startDate) url.searchParams.append("startDate", filters.startDate);
  if (filters?.endDate) url.searchParams.append("endDate", filters.endDate);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Erro ao buscar eventos da cabra.");
  }

  const data = await response.json();
  return data.content; // ✅ a resposta é paginada
}

// ✅ Criar novo evento da cabra (POST)
export async function createGoatEvent(event: EventRequestDTO): Promise<void> {
  try {
    await requestBackEnd.post(`/goats/${event.goatId}/events`, event);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao criar evento da cabra";
    throw new Error(errorMessage);
  }
}

// ✅ Atualizar evento existente da cabra (PUT)
export async function updateEvent(
  goatId: string,
  id: number,
  event: EventRequestDTO
): Promise<void> {
  try {
    await requestBackEnd.put(`/goats/${goatId}/events/${id}`, event);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao atualizar evento";
    throw new Error(errorMessage);
  }
}

// ✅ Excluir evento (DELETE)
export async function deleteEvent(goatId: string, eventId: number): Promise<void> {
  try {
    await requestBackEnd.delete(`/goats/${goatId}/events/${eventId}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Erro ao excluir evento";
    throw new Error(errorMessage);
  }
}
