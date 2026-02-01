import { get, post, put, del } from "../../utils/request";
import { HealthEventDTO, HealthEventCreateDTO, HealthEventUpdateDTO } from "../../Models/HealthDTOs";

const BASE_URL = (farmId: number) => `/goatfarms/${farmId}/health`;

export const healthAPI = {
    // Listar eventos de saúde da fazenda (com filtros opcionais)
    listByFarm: async (farmId: number, params?: Record<string, string | number>): Promise<HealthEventDTO[]> => {
        return get<HealthEventDTO[]>(`${BASE_URL(farmId)}/events`, { params });
    },

    // Listar eventos de saúde de uma cabra específica
    listByGoat: async (farmId: number, goatId: number): Promise<HealthEventDTO[]> => {
        return get<HealthEventDTO[]>(`${BASE_URL(farmId)}/events/goat/${goatId}`);
    },

    // Obter detalhes de um evento
    getById: async (farmId: number, eventId: number): Promise<HealthEventDTO> => {
        return get<HealthEventDTO>(`${BASE_URL(farmId)}/events/${eventId}`);
    },

    // Criar evento
    create: async (farmId: number, data: HealthEventCreateDTO): Promise<HealthEventDTO> => {
        return post<HealthEventDTO>(`${BASE_URL(farmId)}/events`, data);
    },

    // Atualizar evento
    update: async (farmId: number, eventId: number, data: HealthEventUpdateDTO): Promise<HealthEventDTO> => {
        return put<HealthEventDTO>(`${BASE_URL(farmId)}/events/${eventId}`, data);
    },

    // Deletar evento
    delete: async (farmId: number, eventId: number): Promise<void> => {
        return del(`${BASE_URL(farmId)}/events/${eventId}`);
    },

    // Marcar como realizado
    complete: async (farmId: number, eventId: number): Promise<HealthEventDTO> => {
        return put<HealthEventDTO>(`${BASE_URL(farmId)}/events/${eventId}/complete`);
    },

    // Cancelar evento
    cancel: async (farmId: number, eventId: number): Promise<HealthEventDTO> => {
        return put<HealthEventDTO>(`${BASE_URL(farmId)}/events/${eventId}/cancel`);
    }
};
