// src/services/EventService.ts
import { apiClient } from '../api/apiClient';
import type { 
  EventResponseDTO, 
  EventRequestDTO, 
  PaginatedResponse 
} from '../types/api';

export class EventService {
  async getEvents(farmId: number, goatId?: number, page = 0, size = 10): Promise<PaginatedResponse<EventResponseDTO>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(goatId && { goatId: goatId.toString() })
    });
    
    const response = await apiClient.get<PaginatedResponse<EventResponseDTO>>(
      `/farms/${farmId}/events?${params}`
    );
    return response.data;
  }

  async getEventById(farmId: number, eventId: number): Promise<EventResponseDTO> {
    const response = await apiClient.get<EventResponseDTO>(`/farms/${farmId}/events/${eventId}`);
    return response.data;
  }

  async createEvent(farmId: number, event: EventRequestDTO): Promise<EventResponseDTO> {
    const response = await apiClient.post<EventResponseDTO>(`/farms/${farmId}/events`, event);
    return response.data;
  }

  async updateEvent(farmId: number, eventId: number, event: EventRequestDTO): Promise<EventResponseDTO> {
    const response = await apiClient.put<EventResponseDTO>(`/farms/${farmId}/events/${eventId}`, event);
    return response.data;
  }

  async deleteEvent(farmId: number, eventId: number): Promise<void> {
    await apiClient.delete(`/farms/${farmId}/events/${eventId}`);
  }

  async getEventsByGoat(farmId: number, goatId: number): Promise<EventResponseDTO[]> {
    const response = await apiClient.get<EventResponseDTO[]>(`/farms/${farmId}/goats/${goatId}/events`);
    return response.data;
  }

  async getEventsByType(farmId: number, eventType: string): Promise<EventResponseDTO[]> {
    const response = await apiClient.get<EventResponseDTO[]>(
      `/farms/${farmId}/events/type/${eventType}`
    );
    return response.data;
  }
}
