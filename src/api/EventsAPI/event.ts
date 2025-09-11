import { EventRequestDTO, EventResponseDTO } from "../../Models/eventDTO";
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
  const params = new URLSearchParams();

  // 🔁 Converte 'type' do frontend para 'eventType' usado no backend
  if (filters?.type) params.append("eventType", filters.type);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);

  const queryString = params.toString();
  const url = `/goats/${registrationNumber}/events${queryString ? `?${queryString}` : ''}`;

  const response = await requestBackEnd({
    url,
    method: "GET"
  });

  return response.data.content; // ✅ a resposta é paginada
}

// ✅ Criar novo evento da cabra (POST)
export async function createGoatEvent(event: EventRequestDTO): Promise<void> {
  await requestBackEnd({
    url: `/goats/${event.goatId}/events`,
    method: "POST",
    data: event
  });
}

// ✅ Atualizar evento existente da cabra (PUT)
export async function updateEvent(
  goatId: string,
  id: number,
  event: EventRequestDTO
): Promise<void> {
  await requestBackEnd({
    url: `/goats/${goatId}/events/${id}`,
    method: "PUT",
    data: event
  });
}

// ✅ Excluir evento (DELETE)
export async function deleteEvent(goatId: string, eventId: number): Promise<void> {
  await requestBackEnd({
    url: `/goats/${goatId}/events/${eventId}`,
    method: "DELETE"
  });
}
