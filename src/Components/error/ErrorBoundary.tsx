import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AxiosError } from 'axios';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorType?: 'auth' | 'permission' | 'network' | 'unknown';
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Callback quando um erro ocorre */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Componente customizado para renderizar erros */
  fallback?: (error: Error, errorType: string) => ReactNode;
  /** Se true, mostra detalhes técnicos do erro */
  showDetails?: boolean;
}

/**
 * Boundary para capturar erros de autenticação e permissão
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorType = ErrorBoundary.getErrorType(error);
    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorType: ErrorBoundary.getErrorType(error)
    });

    // Chama callback se fornecido
    this.props.onError?.(error, errorInfo);
  }

  private static getErrorType(error: Error): 'auth' | 'permission' | 'network' | 'unknown' {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'auth';
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'permission';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'network';
    }
    return 'unknown';
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleLogin = () => {
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Se há um fallback customizado, usa ele
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorType || 'unknown');
      }

      // Renderização padrão baseada no tipo de erro
      return (
        <div className="error-boundary">
          {this.renderErrorContent()}
        </div>
      );
    }

    return this.props.children;
  }

  private renderErrorContent() {
    const { error, errorType } = this.state;
    const { showDetails = false } = this.props;

    switch (errorType) {
      case 'auth':
        return (
          <div className="error-content auth-error">
            <div className="error-icon">🔒</div>
            <h2>Sessão Expirada</h2>
            <p>Sua sessão expirou. Por favor, faça login novamente para continuar.</p>
            <div className="error-actions">
              <button onClick={this.handleLogin} className="btn btn-primary">
                Fazer Login
              </button>
              <button onClick={this.handleGoHome} className="btn btn-secondary">
                Ir para Início
              </button>
            </div>
          </div>
        );

      case 'permission':
        return (
          <div className="error-content permission-error">
            <div className="error-icon">⛔</div>
            <h2>Acesso Negado</h2>
            <p>Você não tem permissão para acessar este recurso.</p>
            <div className="error-actions">
              <button onClick={this.handleGoHome} className="btn btn-primary">
                Voltar ao Início
              </button>
              <button onClick={() => window.history.back()} className="btn btn-secondary">
                Voltar
              </button>
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="error-content network-error">
            <div className="error-icon">🌐</div>
            <h2>Erro de Conexão</h2>
            <p>Não foi possível conectar ao servidor. Verifique sua conexão com a internet.</p>
            <div className="error-actions">
              <button onClick={this.handleRetry} className="btn btn-primary">
                Tentar Novamente
              </button>
              <button onClick={this.handleGoHome} className="btn btn-secondary">
                Ir para Início
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="error-content unknown-error">
            <div className="error-icon">❌</div>
            <h2>Algo deu errado</h2>
            <p>Ocorreu um erro inesperado. Nossa equipe foi notificada.</p>
            <div className="error-actions">
              <button onClick={this.handleRetry} className="btn btn-primary">
                Tentar Novamente
              </button>
              <button onClick={this.handleGoHome} className="btn btn-secondary">
                Ir para Início
              </button>
            </div>
            {showDetails && error && (
              <details className="error-details">
                <summary>Detalhes técnicos</summary>
                <pre>{error.message}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
          </div>
        );
    }
  }
}

/**
 * Hook para lidar com erros de forma programática
 */
export const useErrorHandler = () => {
  const handleError = (error: unknown) => {
    console.error('Error handled:', error);
    
    if (error instanceof Error) {
      // Verifica se é erro de axios
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        switch (status) {
          case 401:
            // Redireciona para login
            window.location.href = '/login';
            break;
          case 403:
            // Mostra página de acesso negado
            window.location.href = '/403';
            break;
          case 500:
            // Mostra página de erro do servidor
            window.location.href = '/500';
            break;
          default:
            // Log do erro
            console.error('Unhandled HTTP error:', status, axiosError.response.data);
        }
      }
    }
  };

  return { handleError };
};

export default ErrorBoundary;