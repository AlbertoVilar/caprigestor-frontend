import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { getAuthHeaders, isPublicEndpoint } from "../services/auth-service";
import { isPublicEndpoint as permissionIsPublic } from "../services/PermissionService";
import { toast } from "react-toastify";

// Configuração base do axios
export const requestBackEnd = axios.create({
  baseURL: "http://localhost:8080/api",
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
  (config: AxiosRequestConfig) => {
    const url = config.url || '';
    const method = config.method?.toUpperCase() || 'GET';
    
    // Verifica se é endpoint público usando ambos os serviços
    const isPublicAuth = isPublicEndpoint(url, method);
    const isPublicPermission = permissionIsPublic(url);
    const isPublic = isPublicAuth || isPublicPermission;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RequestBackend] ${method} ${url} - Public: ${isPublic}`);
    }
    
    // Obtém headers de autenticação apenas para endpoints privados
    if (!isPublic) {
      const authHeaders = getAuthHeaders(url, method);
      config.headers = {
        ...config.headers,
        ...authHeaders
      };
      
      if (process.env.NODE_ENV === 'development' && authHeaders.Authorization) {
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
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Trata erro 401 (Unauthorized) - mas só para endpoints privados
    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      const method = originalRequest.method?.toUpperCase() || 'GET';
      
      // Verifica se é endpoint público - se for, não tenta refresh
      const isPublicAuth = isPublicEndpoint(url, method);
      const isPublicPermission = permissionIsPublic(url);
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
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh-token', {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Atualiza tokens no localStorage
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          // Processa fila de requisições pendentes
          processQueue(null, accessToken);
          
          // Refaz a requisição original
          return requestBackEnd(originalRequest);
        } else {
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        // Falha no refresh - limpa tokens e redireciona
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Notifica o usuário
        toast.error('Sessão expirada. Faça login novamente.');
        
        // Redireciona para login apenas se não estiver já na página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Trata erro 403 (Forbidden)
    if (error.response?.status === 403) {
      toast.error('Você não tem permissão para realizar esta ação.');
      
      // Redireciona para página de acesso negado se não estiver já lá
      if (!window.location.pathname.includes('/403')) {
        window.location.href = '/403';
      }
    }
    
    // Trata outros erros de servidor
    if (error.response?.status && error.response.status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
    }
    
    // Trata erros de rede
    if (!error.response) {
      toast.error('Erro de conexão. Verifique sua internet.');
    }
    
    if (process.env.NODE_ENV === 'development') {
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
