// src/services/FarmService.ts
import { apiClient } from '../api/apiClient';
import type { 
  FarmResponseDTO, 
  FarmRequestDTO, 
  PaginatedResponse 
} from '../types/api';

export class FarmService {
  async getFarms(page = 0, size = 10, search?: string): Promise<PaginatedResponse<FarmResponseDTO>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(search && { search })
    });
    
    const response = await apiClient.get(`/farms?${params}`);
    return response.data;
  }

  async getFarmById(id: number): Promise<FarmResponseDTO> {
    const response = await apiClient.get(`/farms/${id}`);
    return response.data;
  }

  async createFarm(farm: FarmRequestDTO): Promise<FarmResponseDTO> {
    const response = await apiClient.post('/farms', farm);
    return response.data;
  }

  async updateFarm(id: number, farm: FarmRequestDTO): Promise<FarmResponseDTO> {
    const response = await apiClient.put(`/farms/${id}`, farm);
    return response.data;
  }

  async deleteFarm(id: number): Promise<void> {
    await apiClient.delete(`/farms/${id}`);
  }

  async getUserFarms(): Promise<FarmResponseDTO[]> {
    const response = await apiClient.get('/farms/user');
    return response.data;
  }
}