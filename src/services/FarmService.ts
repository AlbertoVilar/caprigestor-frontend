// 🌐 Serviço para comunicação com a API de Fazendas

import { GoatFarmFullRequest, GoatFarmFullResponse } from '../types/farmTypes';

/**
 * Classe responsável pela comunicação com a API de fazendas
 */
export class FarmService {
  private static readonly BASE_URL = 'http://localhost:8080/api';
  private static readonly ENDPOINTS = {
    CREATE_FULL_FARM: '/goatfarms/full'
  };

  /**
   * Cria uma fazenda completa com usuário, endereço e telefones
   * @param farmData - Dados completos da fazenda
   * @returns Promise com a resposta da API
   */
  static async createFullFarm(farmData: GoatFarmFullRequest): Promise<GoatFarmFullResponse> {
    try {
      console.log('🚀 Enviando dados para criação de fazenda:', farmData);
      
      const response = await fetch(`${this.BASE_URL}${this.ENDPOINTS.CREATE_FULL_FARM}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(farmData)
      });

      console.log('📡 Status da resposta:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Erro na resposta da API:', {
            status: response.status,
            statusText: response.statusText,
            body: errorData
          });
          
          // Tratar erro 409 (Conflict) especificamente
          if (response.status === 409) {
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else {
              errorMessage = 'Dados já cadastrados no sistema (CPF ou email já existem)';
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Se não conseguir fazer parse do JSON, usa texto simples
          const errorText = await response.text();
          console.error('❌ Erro na resposta da API (texto):', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
        }
        
        throw new Error(errorMessage);
      }

      const result: GoatFarmFullResponse = await response.json();
      console.log('✅ Fazenda criada com sucesso:', result);
      
      return result;
    } catch (error) {
      console.error('💥 Erro ao criar fazenda:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão com o servidor. Verifique se a API está rodando.');
      }
      
      throw error;
    }
  }

  /**
   * Valida se a API está acessível
   * @returns Promise<boolean> - true se a API estiver acessível
   */
  static async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.warn('⚠️ API não está acessível:', error);
      return false;
    }
  }

  /**
   * Obtém a URL base da API
   * @returns string - URL base da API
   */
  static getBaseUrl(): string {
    return this.BASE_URL;
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