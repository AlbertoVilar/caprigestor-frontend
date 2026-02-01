import { AxiosRequestConfig } from "axios";
import { requestBackEnd } from "../../utils/request";
import { 
  HealthEventCreateRequestDTO, 
  HealthEventUpdateRequestDTO, 
  HealthEventDoneRequestDTO, 
  HealthEventCancelRequestDTO,
  HealthEventResponseDTO,
  HealthEventType,
  HealthEventStatus
} from "../../Models/HealthDTOs";

export const healthAPI = {
  
  create: async (farmId: number, goatId: string, data: HealthEventCreateRequestDTO): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "POST",
      url: `/api/goatfarms/${farmId}/goats/${goatId}/health-events`,
      data: data
    };
    return requestBackEnd(config).then(res => res.data);
  },

  update: async (farmId: number, goatId: string, eventId: number, data: HealthEventUpdateRequestDTO): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "PUT",
      url: `/api/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}`,
      data: data
    };
    return requestBackEnd(config).then(res => res.data);
  },

  markAsDone: async (farmId: number, goatId: string, eventId: number, data: HealthEventDoneRequestDTO): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "PATCH",
      url: `/api/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}/done`,
      data: data
    };
    return requestBackEnd(config).then(res => res.data);
  },

  cancel: async (farmId: number, goatId: string, eventId: number, data: HealthEventCancelRequestDTO): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "PATCH",
      url: `/api/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}/cancel`,
      data: data
    };
    return requestBackEnd(config).then(res => res.data);
  },

  getById: async (farmId: number, goatId: string, eventId: number): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "GET",
      url: `/api/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}`
    };
    return requestBackEnd(config).then(res => res.data);
  },

  listByGoat: async (
    farmId: number, 
    goatId: string, 
    params?: { 
      type?: HealthEventType; 
      status?: HealthEventStatus; 
      from?: string; 
      to?: string; 
      page?: number; 
      size?: number 
    }
  ): Promise<any> => { // Returns Page<HealthEventResponseDTO> but using any for flexibility with Page wrapper
    const config: AxiosRequestConfig = {
      method: "GET",
      url: `/api/goatfarms/${farmId}/goats/${goatId}/health-events`,
      params: params
    };
    return requestBackEnd(config).then(res => res.data);
  }
};
