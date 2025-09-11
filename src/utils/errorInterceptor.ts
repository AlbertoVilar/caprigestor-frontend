import { AxiosError, AxiosResponse } from 'axios';
import { requestBackEnd } from './request';

/**
 * Interface para configuração do interceptador de erros
 */
export interface ErrorInterceptorConfig {
  /** Se true, redireciona automaticamente para páginas de erro */
  autoRedirect?: boolean;
  /** Callback customizado para erros 401 */
  onUnauthorized?: (error: AxiosError) => void;
  /** Callback customizado para erros 403 */
  onForbidden?: (error: AxiosError) => void;
  /** Callback customizado para erros 500 */
  onServerError?: (error: AxiosError) => void;
  /** Callback para outros erros */
  onOtherError?: (error: AxiosError) => void;
  /** Se true, mostra notificações de erro */
  showNotifications?: boolean;
}

/**
 * Configuração padrão do interceptador
 */
const defaultConfig: ErrorInterceptorConfig = {
  autoRedirect: true,
  showNotifications: true
};

/**
 * Classe para gerenciar interceptação de erros HTTP
 */
export class ErrorInterceptor {
  private config: ErrorInterceptorConfig;
  private interceptorId: number | null = null;

  constructor(config: ErrorInterceptorConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Instala o interceptador de erros
   */
  install() {
    if (this.interceptorId !== null) {
      console.warn('ErrorInterceptor já está instalado');
      return;
    }

    this.interceptorId = requestBackEnd.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => this.handleError(error)
    );

    console.log('ErrorInterceptor instalado com sucesso');
  }

  /**
   * Remove o interceptador de erros
   */
  uninstall() {
    if (this.interceptorId !== null) {
      requestBackEnd.interceptors.response.eject(this.interceptorId);
      this.interceptorId = null;
      console.log('ErrorInterceptor removido');
    }
  }

  /**
   * Manipula erros HTTP
   */
  private async handleError(error: AxiosError): Promise<never> {
    const status = error.response?.status;
    const config = error.config;

    // Log do erro para debug
    console.error('HTTP Error intercepted:', {
      status,
      url: config?.url,
      method: config?.method,
      message: error.message,
      response: error.response?.data
    });

    // Trata diferentes tipos de erro
    switch (status) {
      case 401:
        await this.handleUnauthorized(error);
        break;
      case 403:
        await this.handleForbidden(error);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        await this.handleServerError(error);
        break;
      default:
        await this.handleOtherError(error);
    }

    // Sempre rejeita a promise para manter o comportamento esperado
    return Promise.reject(error);
  }

  /**
   * Trata erros 401 - Não autorizado
   */
  private async handleUnauthorized(error: AxiosError) {
    if (this.config.showNotifications) {
      this.showNotification('Sessão expirada. Redirecionando para login...', 'warning');
    }

    // Callback customizado
    if (this.config.onUnauthorized) {
      this.config.onUnauthorized(error);
      return;
    }

    // Comportamento padrão
    if (this.config.autoRedirect) {
      // Remove token inválido
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
      // Redireciona após um pequeno delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  }

  /**
   * Trata erros 403 - Acesso proibido
   */
  private async handleForbidden(error: AxiosError) {
    if (this.config.showNotifications) {
      this.showNotification('Acesso negado. Você não tem permissão para esta ação.', 'error');
    }

    // Callback customizado
    if (this.config.onForbidden) {
      this.config.onForbidden(error);
      return;
    }

    // Comportamento padrão
    if (this.config.autoRedirect) {
      setTimeout(() => {
        window.location.href = '/403';
      }, 1000);
    }
  }

  /**
   * Trata erros 5xx - Erro do servidor
   */
  private async handleServerError(error: AxiosError) {
    if (this.config.showNotifications) {
      this.showNotification('Erro no servidor. Tente novamente em alguns instantes.', 'error');
    }

    // Callback customizado
    if (this.config.onServerError) {
      this.config.onServerError(error);
      return;
    }

    // Comportamento padrão
    if (this.config.autoRedirect) {
      setTimeout(() => {
        window.location.href = '/500';
      }, 2000);
    }
  }

  /**
   * Trata outros erros
   */
  private async handleOtherError(error: AxiosError) {
    const status = error.response?.status;
    
    if (this.config.showNotifications) {
      let message = 'Ocorreu um erro inesperado.';
      
      if (status) {
        message = `Erro ${status}: ${error.message}`;
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Erro de conexão. Verifique sua internet.';
      }
      
      this.showNotification(message, 'error');
    }

    // Callback customizado
    if (this.config.onOtherError) {
      this.config.onOtherError(error);
    }
  }

  /**
   * Mostra notificação (implementação simples)
   */
  private showNotification(message: string, type: 'success' | 'warning' | 'error' | 'info') {
    // Implementação simples usando alert
    // Em um projeto real, você usaria uma biblioteca de notificações como react-toastify
    if (type === 'error') {
      console.error('🚨', message);
    } else if (type === 'warning') {
      console.warn('⚠️', message);
    } else {
      console.info('ℹ️', message);
    }

    // Cria uma notificação visual simples
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      background-color: ${
        type === 'error' ? '#f44336' :
        type === 'warning' ? '#ff9800' :
        type === 'success' ? '#4caf50' : '#2196f3'
      };
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * Atualiza a configuração do interceptador
   */
  updateConfig(newConfig: Partial<ErrorInterceptorConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Instância global do interceptador de erros
 */
export const globalErrorInterceptor = new ErrorInterceptor();

/**
 * Função utilitária para instalar o interceptador com configuração customizada
 */
export const setupErrorInterceptor = (config?: ErrorInterceptorConfig) => {
  if (config) {
    globalErrorInterceptor.updateConfig(config);
  }
  globalErrorInterceptor.install();
};

/**
 * Função utilitária para remover o interceptador
 */
export const removeErrorInterceptor = () => {
  globalErrorInterceptor.uninstall();
};

export default ErrorInterceptor;