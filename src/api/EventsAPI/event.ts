import { EventRequestDTO, EventResponseDTO } from "../../Models/eventDTO";
import { requestBackEnd } from "../../utils/request";

interface Filters {
  type?: string; // Usamos 'type' no frontend, mas convertemos para 'eventType' no backend
  startDate?: string; // formato ISO yyyy-MM-dd
  endDate?: string;   // formato ISO yyyy-MM-dd
  page?: number;      // paginação opcional (default 0)
  size?: number;      // paginação opcional (default 12)
}

// ✅ Buscar eventos da cabra com filtros (GET) - rotas aninhadas
export async function getGoatEvents(
  farmId: number,
  goatId: string,
  filters?: Filters
): Promise<EventResponseDTO[]> {
  // Monta params incluindo paginação padrão
  const page = filters?.page ?? 0;
  const size = filters?.size ?? 12;

  const hasType = !!filters?.type;
  const hasStart = !!filters?.startDate;
  const hasEnd = !!filters?.endDate;
  const hasFilter = hasType || hasStart || hasEnd;

  const params: Record<string, string | number> = { page, size };
  if (hasType) params.eventType = filters!.type as string;
  if (hasStart) params.startDate = filters!.startDate as string;
  if (hasEnd) params.endDate = filters!.endDate as string;

  const base = `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/events`;
  const url = hasFilter ? `${base}/filter` : base;

  const { data } = await requestBackEnd({ url, method: "GET", params });
  const pageBody = data?.data ?? data;
  const content = Array.isArray(pageBody) ? pageBody : (pageBody?.content ?? []);
  return content;
}

// ✅ Criar novo evento da cabra (POST) - rotas aninhadas
export async function createGoatEvent(farmId: number, event: EventRequestDTO): Promise<void> {
  await requestBackEnd({
    url: `/goatfarms/${farmId}/goats/${encodeURIComponent(event.goatId)}/events`,
    method: "POST",
    data: event
  });
}

// ✅ Atualizar evento existente da cabra (PUT)
export async function updateEvent(
  farmId: number,
  goatId: string,
  id: number,
  event: EventRequestDTO
): Promise<void> {
  await requestBackEnd({
    url: `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/events/${id}`,
    method: "PUT",
    data: event
  });
}

// ✅ Excluir evento (DELETE)
export async function deleteEvent(farmId: number, goatId: string, eventId: number): Promise<void> {
  await requestBackEnd({
    url: `/goatfarms/${farmId}/goats/${encodeURIComponent(goatId)}/events/${eventId}`,
    method: "DELETE"
  });
}
