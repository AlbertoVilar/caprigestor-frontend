// 🌐 Serviço para comunicação com a API de Fazendas

import { GoatFarmFullRequest, GoatFarmFullResponse } from '../types/farmTypes';
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
    CREATE_FULL_FARM: '/goatfarms/full'
  };

  /**
   * Cria uma fazenda completa com usuário, endereço e telefones (REGISTRO INICIAL - SEM AUTENTICAÇÃO)
   * Este método é usado durante o registro inicial, não requer que o usuário esteja autenticado
   * @param farmData - Dados completos da fazenda
   * @returns Promise com a resposta da API
   */
  static async createFullFarm(farmData: GoatFarmFullRequest): Promise<GoatFarmFullResponse> {
    try {
      console.log('🚀 Enviando dados para criação de fazenda (registro inicial):', farmData);
      
      const { data, status } = await requestBackEnd.post<GoatFarmFullResponse>(
        this.ENDPOINTS.REGISTER_FARM,
        farmData
      );

      console.log('📡 Status da resposta:', status);
      console.log('✅ Fazenda criada com sucesso:', data);
      
      return data;
    } catch (err) {
      const error = err as AxiosError<{ message?: string; error?: string }>;
      console.error('💥 Erro ao criar fazenda:', error);
      
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

      console.error('❌ Erro na resposta da API:', {
        status,
        errorData,
        errorMessage
      });
      
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
      console.log('🚀 Enviando dados para criação de fazenda adicional (autenticado):', farmData);
      
      const { data, status } = await requestBackEnd.post<GoatFarmFullResponse>(
        this.ENDPOINTS.CREATE_FULL_FARM,
        farmData
      );

      console.log('📡 Status da resposta:', status);
      console.log('✅ Fazenda adicional criada com sucesso:', data);
      
      return data;
    } catch (err) {
      const error = err as AxiosError<{ message?: string; error?: string }>;
      console.error('💥 Erro ao criar fazenda adicional:', error);
      
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

      console.error('❌ Erro na resposta da API:', {
        status,
        errorData,
        errorMessage
      });
      
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