import { AxiosRequestConfig } from "axios";
import { requestBackEnd } from "../../utils/request";
import { 
  HealthEventCreateRequestDTO, 
  HealthEventUpdateRequestDTO, 
  HealthEventDoneRequestDTO, 
  HealthEventCancelRequestDTO,
  HealthEventResponseDTO,
  GoatWithdrawalStatusDTO,
  HealthEventType,
  HealthEventStatus
} from "../../Models/HealthDTOs";
import { HealthAlertsDTO } from "../../Models/HealthAlertsDTO";
import { AlertsEventBus } from "../../services/alerts/AlertsEventBus";

async function requestHealthMutation<T>(
  farmId: number,
  config: AxiosRequestConfig
): Promise<T> {
  const response = await requestBackEnd(config);
  AlertsEventBus.emit(farmId);
  return response.data as T;
}

export const healthAPI = {
  
  getCalendar: async (
    farmId: number,
    params: Record<string, string | number | undefined>
  ): Promise<HealthEventPage> => {
    const config: AxiosRequestConfig = {
      method: "GET",
      url: `/goatfarms/${farmId}/health-events/calendar`,
      params: params
    };
    return requestBackEnd(config).then(res => res.data);
  },

  getAlerts: async (farmId: number, windowDays: number = 7): Promise<HealthAlertsDTO> => {
    const config: AxiosRequestConfig = {
      method: "GET",
      url: `/goatfarms/${farmId}/health-events/alerts`,
      params: { windowDays }
    };
    return requestBackEnd(config).then(res => res.data);
  },

  getWithdrawalStatus: async (
    farmId: number,
    goatId: string,
    referenceDate?: string
  ): Promise<GoatWithdrawalStatusDTO> => {
    const config: AxiosRequestConfig = {
      method: "GET",
      url: `/goatfarms/${farmId}/goats/${goatId}/health-events/withdrawal-status`,
      params: referenceDate ? { referenceDate } : undefined
    };
    return requestBackEnd(config).then(res => res.data);
  },

  create: async (farmId: number, goatId: string, data: HealthEventCreateRequestDTO): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "POST",
      url: `/goatfarms/${farmId}/goats/${goatId}/health-events`,
      data: data
    };
    return requestHealthMutation(farmId, config);
  },

  update: async (farmId: number, goatId: string, eventId: number, data: HealthEventUpdateRequestDTO): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "PUT",
      url: `/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}`,
      data: data
    };
    return requestHealthMutation(farmId, config);
  },

  markAsDone: async (farmId: number, goatId: string, eventId: number, data: HealthEventDoneRequestDTO): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "PATCH",
      url: `/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}/done`,
      data: data
    };
    return requestHealthMutation(farmId, config);
  },

  cancel: async (farmId: number, goatId: string, eventId: number, data: HealthEventCancelRequestDTO): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "PATCH",
      url: `/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}/cancel`,
      data: data
    };
    return requestHealthMutation(farmId, config);
  },

  reopen: async (farmId: number, goatId: string, eventId: number): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "PATCH",
      url: `/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}/reopen`
    };
    return requestHealthMutation(farmId, config);
  },

  getById: async (farmId: number, goatId: string, eventId: number): Promise<HealthEventResponseDTO> => {
    const config: AxiosRequestConfig = {
      method: "GET",
      url: `/goatfarms/${farmId}/goats/${goatId}/health-events/${eventId}`
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
      size?: number;
    }
  ): Promise<HealthEventPage> => {
    const config: AxiosRequestConfig = {
      method: "GET",
      url: `/goatfarms/${farmId}/goats/${goatId}/health-events`,
      params: params
    };
    return requestBackEnd(config).then(res => res.data);
  }
};

type HealthEventPage = {
  content: HealthEventResponseDTO[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};
