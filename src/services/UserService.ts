// src/services/UserService.ts
import { apiClient } from '../api/apiClient';
import type { 
  UserResponseDTO, 
  UserRequestDTO, 
  PaginatedResponse 
} from '../types/api';

export class UserService {
  async getUsers(page = 0, size = 10, search?: string): Promise<PaginatedResponse<UserResponseDTO>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(search && { search })
    });
    
    const response = await apiClient.get<PaginatedResponse<UserResponseDTO>>(`/users?${params}`);
    return response.data;
  }

  async getUserById(id: number): Promise<UserResponseDTO> {
    const response = await apiClient.get<UserResponseDTO>(`/users/${id}`);
    return response.data;
  }

  async getCurrentUser(): Promise<UserResponseDTO> {
    const response = await apiClient.get<UserResponseDTO>('/users/me');
    return response.data;
  }

  async updateUser(id: number, user: UserRequestDTO): Promise<UserResponseDTO> {
    const response = await apiClient.put<UserResponseDTO>(`/users/${id}`, user);
    return response.data;
  }

  async updateCurrentUser(user: UserRequestDTO): Promise<UserResponseDTO> {
    const response = await apiClient.put<UserResponseDTO>('/users/me', user);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/users/me/password', {
      oldPassword,
      newPassword
    });
  }

  async getUserPermissions(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/users/me/permissions');
    return response.data;
  }
}
