// src/services/GoatService.ts
import { apiClient } from '../api/apiClient';
import type { 
  GoatResponseDTO, 
  GoatRequestDTO, 
  PaginatedResponse 
} from '../types/api';

export class GoatService {
  async getGoats(farmId: number, page = 0, size = 10, search?: string): Promise<PaginatedResponse<GoatResponseDTO>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(search && { search })
    });
    
    const response = await apiClient.get<PaginatedResponse<GoatResponseDTO>>(
      `/farms/${farmId}/goats?${params}`
    );
    return response.data;
  }

  async getGoatById(farmId: number, goatId: number): Promise<GoatResponseDTO> {
    const response = await apiClient.get<GoatResponseDTO>(`/farms/${farmId}/goats/${goatId}`);
    return response.data;
  }

  async createGoat(farmId: number, goat: GoatRequestDTO): Promise<GoatResponseDTO> {
    const response = await apiClient.post<GoatResponseDTO>(`/farms/${farmId}/goats`, goat);
    return response.data;
  }

  async updateGoat(farmId: number, goatId: number, goat: GoatRequestDTO): Promise<GoatResponseDTO> {
    const response = await apiClient.put<GoatResponseDTO>(`/farms/${farmId}/goats/${goatId}`, goat);
    return response.data;
  }

  async deleteGoat(farmId: number, goatId: number): Promise<void> {
    await apiClient.delete(`/farms/${farmId}/goats/${goatId}`);
  }

  async getGoatsByStatus(farmId: number, status: string): Promise<GoatResponseDTO[]> {
    const response = await apiClient.get<GoatResponseDTO[]>(`/farms/${farmId}/goats/status/${status}`);
    return response.data;
  }

  async getGoatsByGender(farmId: number, gender: string): Promise<GoatResponseDTO[]> {
    const response = await apiClient.get<GoatResponseDTO[]>(`/farms/${farmId}/goats/gender/${gender}`);
    return response.data;
  }
}
