import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from "axios";
import { getAuthHeaders, isPublicEndpoint } from "../services/auth-service";
import { isPublicEndpoint as permissionIsPublic } from "../services/PermissionService";
import { toast } from "react-toastify";

// Configuração base do axios
const getBaseURL = () => {
  const envBaseURL = import.meta.env.VITE_API_BASE_URL;
  const devMode = import.meta.env.VITE_DEV_MODE === 'true';
  
  if (devMode && !envBaseURL) {
    console.warn('⚠️ MODO DESENVOLVIMENTO: Backend não configurado. Usando URL padrão.');
  }
  
  return envBaseURL || "http://localhost:8080/api";
};

export const requestBackEnd = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para evitar múltiplas tentativas de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

// Processa a fila de requisições após refresh do token
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor de requisição - adiciona token automaticamente
requestBackEnd.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';
    const method = config.method?.toUpperCase() || 'GET';
    
    // Verifica se é endpoint público usando ambos os serviços
    const isPublicAuth = isPublicEndpoint(url, method);
    const isPublicPermission = permissionIsPublic(url, method);
    const isPublic = isPublicAuth || isPublicPermission;
    
    if (import.meta.env.DEV) {
      console.log(`[RequestBackend] ${method} ${url} - Public: ${isPublic}`);
    }
    
    // Obtém headers de autenticação apenas para endpoints privados
    if (!isPublic) {
      const authHeaders = getAuthHeaders(url, method);
      const mergedHeaders = new AxiosHeaders(config.headers);
      Object.entries(authHeaders).forEach(([key, value]) => {
        if (value) mergedHeaders.set(key, value);
      });
      config.headers = mergedHeaders;
      
      if (import.meta.env.DEV && authHeaders.Authorization) {
        console.log('[RequestBackend] Token adicionado');
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[RequestBackend] Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta - trata erros e refresh token
requestBackEnd.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Trata erro 401 (Unauthorized) - mas só para endpoints privados
    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      const method = originalRequest.method?.toUpperCase() || 'GET';
      
      // Verifica se é endpoint público - se for, não tenta refresh
      const isPublicAuth = isPublicEndpoint(url, method);
      const isPublicPermission = permissionIsPublic(url, method);
      const isPublic = isPublicAuth || isPublicPermission;
      
      if (isPublic) {
        console.log(`[RequestBackend] Erro 401 em endpoint público: ${method} ${url}`);
        return Promise.reject(error);
      }
      if (isRefreshing) {
        // Se já está fazendo refresh, adiciona à fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return requestBackEnd(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenta fazer refresh do token
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          // Atualiza tokens no localStorage usando auth-service
          localStorage.setItem('authToken', access_token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          
          // Processa fila de requisições pendentes
          processQueue(null, access_token);
          
          // Refaz a requisição original
          return requestBackEnd(originalRequest);
        } else {
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        // Falha no refresh - limpa tokens e redireciona
        processQueue(refreshError, null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refresh_token');
        
        // Notifica o usuário
        toast.error('Sessão expirada. Faça login novamente.');
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Trata erro 403 (Forbidden)
    if (error.response?.status === 403) {
      toast.error('Você não tem permissão para realizar esta ação.');
      
      console.log('🔍 DEBUG: Interceptor detectou erro 403, mas não redirecionando automaticamente');
    }
    
    // Trata outros erros de servidor
    if (error.response?.status && error.response.status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
    }
    
    // Trata erros de rede
    if (!error.response) {
      const devMode = import.meta.env.VITE_DEV_MODE === 'true';
      const baseURL = getBaseURL();
      
      console.error('[RequestBackend] Erro de rede - servidor indisponível');
      
      if (devMode) {
        toast.error(
          `🔧 MODO DESENVOLVIMENTO: Backend não está rodando em ${baseURL}. ` +
          'Inicie o servidor backend ou configure VITE_API_BASE_URL no arquivo .env',
          { autoClose: 8000 }
        );
      } else {
        toast.error('Erro de conexão com o servidor. Verifique sua conexão.');
      }
    }
    
    if (import.meta.env.DEV) {
      console.error('[RequestBackend] Erro na resposta:', error);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Função utilitária para fazer requisições com tratamento de erros padronizado
 */
export const makeRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await requestBackEnd(config);
    return response.data;
  } catch (error) {
    // O erro já foi tratado pelo interceptor
    throw error;
  }
};

/**
 * Função para requisições GET
 */
export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return makeRequest<T>({ ...config, method: 'GET', url });
};

/**
 * Função para requisições POST
 */
export const post = <T = any>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<T> => {
  return makeRequest<T>({ ...config, method: 'POST', url, data });
};

/**
 * Função para requisições PUT
 */
export const put = <T = any>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<T> => {
  return makeRequest<T>({ ...config, method: 'PUT', url, data });
};

/**
 * Função para requisições DELETE
 */
export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return makeRequest<T>({ ...config, method: 'DELETE', url });
};

/**
 * Função para requisições PATCH
 */
export const patch = <T = any>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<T> => {
  return makeRequest<T>({ ...config, method: 'PATCH', url, data });
};

export default requestBackEnd;
