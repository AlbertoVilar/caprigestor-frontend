// 🌐 Serviço para comunicação com a API de Fazendas

import { GoatFarmFullRequest, GoatFarmFullResponse } from '../types/farmTypes';
import type { PaginatedResponse } from '../types/api';
import { requestBackEnd } from '../utils/request';
import type { AxiosError } from 'axios';

/**
 * Classe responsável pela comunicação com a API de fazendas
 */
export class FarmService {
  private static readonly ENDPOINTS = {
    // Endpoint público para registro inicial (sem autenticação)
    REGISTER_FARM: '/auth/register-farm',
    // Endpoint protegido para criar fazenda adicional (requer autenticação)
    CREATE_FULL_FARM: '/goatfarms/full',
    LIST_FARMS: '/goatfarms',
    SEARCH_FARMS_BY_NAME: '/goatfarms/name'
  };

  async getFarms(
    page: number = 0,
    size: number = 10,
    name?: string
  ): Promise<PaginatedResponse<GoatFarmFullResponse>> {
    const endpoint = name ? FarmService.ENDPOINTS.SEARCH_FARMS_BY_NAME : FarmService.ENDPOINTS.LIST_FARMS;
    const params: Record<string, string | number> = { page, size };
    if (name) params.name = name;

    const { data } = await requestBackEnd.get<PaginatedResponse<GoatFarmFullResponse>>(endpoint, { params });
    return data;
  }

  /**
   * Cria uma fazenda completa com usuário, endereço e telefones (REGISTRO INICIAL - SEM AUTENTICAÇÃO)
   * Este método é usado durante o registro inicial, não requer que o usuário esteja autenticado
   * @param farmData - Dados completos da fazenda
   * @returns Promise com a resposta da API
   */
  static async createFullFarm(farmData: GoatFarmFullRequest): Promise<GoatFarmFullResponse> {
    try {
      const { data } = await requestBackEnd.post<GoatFarmFullResponse>(
        this.ENDPOINTS.REGISTER_FARM,
        farmData
      );

      return data;
    } catch (err) {
      const error = err as AxiosError<{ message?: string; error?: string }>;
      
      const status = error.response?.status;
      const errorData = error.response?.data;
      let errorMessage = 'Erro ao criar fazenda';

      // Tratar erro 409 (Conflict) especificamente
      if (status === 409) {
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = 'Dados já cadastrados no sistema (CPF ou email já existem)';
        }
      } else if (status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (status === 403) {
        errorMessage = 'Você não tem permissão para criar fazendas.';
      } else if (status === 400) {
        errorMessage = errorData?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Cria uma fazenda adicional (REQUER AUTENTICAÇÃO)
   * Este método é usado quando o usuário já está logado e quer criar uma fazenda adicional
   * @param farmData - Dados completos da fazenda
   * @returns Promise com a resposta da API
   */
  static async createAdditionalFarm(farmData: GoatFarmFullRequest): Promise<GoatFarmFullResponse> {
    try {
      const { data } = await requestBackEnd.post<GoatFarmFullResponse>(
        this.ENDPOINTS.CREATE_FULL_FARM,
        farmData
      );

      return data;
    } catch (err) {
      const error = err as AxiosError<{ message?: string; error?: string }>;
      
      const status = error.response?.status;
      const errorData = error.response?.data;
      let errorMessage = 'Erro ao criar fazenda';

      // Tratar erro 409 (Conflict) especificamente
      if (status === 409) {
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = 'Dados já cadastrados no sistema (Nome ou TOD já existem)';
        }
      } else if (status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (status === 403) {
        errorMessage = 'Você não tem permissão para criar fazendas.';
      } else if (status === 400) {
        errorMessage = errorData?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Obtém todos os endpoints disponíveis
   * @returns object - Objeto com todos os endpoints
   */
  static getEndpoints() {
    return this.ENDPOINTS;
  }
}

// Exportação padrão para facilitar importação
export default FarmService;
