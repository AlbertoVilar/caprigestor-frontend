noj# 🔐 Guia Completo de Roles e Permissões para o Frontend - GoatFarm

## 📋 Roles Disponíveis no Sistema

### 1. **ROLE_ADMIN**
- **Descrição**: Administrador do sistema com acesso total
- **Permissões**: 
  - Acesso completo a todos os recursos
  - Gerenciamento de usuários (`/api/admin/**`)
  - CRUD em todas as fazendas e caprinos
  - Acesso a relatórios e estatísticas
  - Pode editar recursos de qualquer usuário

### 2. **ROLE_FARM_OWNER** 
- **Descrição**: Proprietário de fazenda
- **Permissões**:
  - CRUD apenas nos recursos da própria fazenda
  - Gerenciamento de caprinos da própria fazenda
  - Acesso a dados genealógicos dos próprios animais
  - Verificação de ownership automática pelo backend

### 3. **ROLE_OPERATOR**
- **Descrição**: Operador do sistema (similar ao FARM_OWNER)
- **Permissões**: Equivalente ao FARM_OWNER para operações básicas
- **Uso**: Role padrão atribuída no cadastro quando nenhuma role é especificada

### 4. **ROLE_PUBLIC** (Usuários não autenticados)
- **Descrição**: Acesso público limitado
- **Permissões**: Apenas leitura de caprinos e genealogia

## 🔑 Estrutura do JWT Token

### Resposta do Login (`POST /api/auth/login`)

```typescript
interface LoginResponse {
  accessToken: string;    // JWT com 24h de validade
  refreshToken: string;   // Para renovar o access token
  tokenType: "Bearer";    // Tipo do token
  expiresIn: 3600;       // Tempo em segundos (1 hora para exibição, mas token dura 24h)
  user: {
    id: number;
    name: string;
    email: string;
    cpf: string;
    roles: string[];     // ["ROLE_ADMIN", "ROLE_OPERATOR"]
  }
}
```

### Claims Internos do JWT

```typescript
{
  "iss": "goatfarm-api",           // Emissor
  "sub": "usuario@email.com",      // Subject (email do usuário)
  "scope": "ROLE_ADMIN ROLE_OPERATOR", // Roles separadas por espaço
  "userId": 1,                     // ID do usuário
  "name": "Nome do Usuário",       // Nome completo
  "email": "usuario@email.com",    // Email
  "iat": 1640995200,               // Issued at
  "exp": 1641081600                // Expiration (24h depois)
}
```

## 🛡️ Modelo de Segurança: "Registro Público, Gestão Protegida"

### Endpoints Públicos (sem autenticação necessária)

```typescript
const PUBLIC_ENDPOINTS = [
  'GET:/api/goats/**',              // Visualizar caprinos
  'GET:/api/genealogy/**',          // Visualizar genealogia  
  'GET:/api/farms/**',              // Visualizar fazendas
  'GET:/api/goatfarms/**',          // Visualizar fazendas (endpoint real)
  'POST:/api/auth/login',           // Login
  'POST:/api/auth/register-farm',   // Registro de fazenda completa
  'POST:/api/auth/refresh',         // Refresh token
  'GET:/api/auth/me'                // Perfil do usuário (se autenticado)
];
```

### Endpoints Protegidos por Role

```typescript
// Requer FARM_OWNER, ADMIN ou OPERATOR + verificação de ownership
const PROTECTED_CRUD_ENDPOINTS = [
  'POST:/api/farms/**',
  'PUT:/api/farms/**', 
  'DELETE:/api/farms/**',
  'POST:/api/goatfarms/**',
  'PUT:/api/goatfarms/**',
  'DELETE:/api/goatfarms/**',
  'POST:/api/goats/**',
  'PUT:/api/goats/**',
  'DELETE:/api/goats/**',
  'POST:/api/genealogy/**',
  'PUT:/api/genealogy/**',
  'DELETE:/api/genealogy/**'
];

// Requer apenas ROLE_ADMIN
const ADMIN_ONLY_ENDPOINTS = [
  '/api/admin/**',                  // Todos os endpoints administrativos
  'DELETE:/api/users/**',           // Deletar usuários
  'PUT:/api/users/{id}/roles'       // Gerenciar roles de usuários
];

// Requer FARM_OWNER, ADMIN ou OPERATOR (sem verificação de ownership)
const USER_MANAGEMENT_ENDPOINTS = [
  'GET:/api/users/**',              // Listar/visualizar usuários
  'POST:/api/users',                // Criar usuários
  'PUT:/api/users/**'               // Atualizar usuários
];
```

## 💻 Implementação Completa no Frontend

### 1. Hook de Permissões (`hooks/usePermissions.ts`)

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { GoatFarmResponse, GoatResponse } from '@/types';

export const usePermissions = () => {
  const { user } = useAuth();

  // Verificações básicas de role
  const isAdmin = (): boolean => {
    return user?.roles.includes('ROLE_ADMIN') || false;
  };

  const isFarmOwner = (): boolean => {
    return user?.roles.includes('ROLE_FARM_OWNER') || false;
  };

  const isOperator = (): boolean => {
    return user?.roles.includes('ROLE_OPERATOR') || false;
  };

  const isAuthenticated = (): boolean => {
    return !!user;
  };

  // Verificações de permissões específicas
  const canEditFarm = (farm: GoatFarmResponse): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    if (isFarmOwner() || isOperator()) {
      return farm.userId === user.id; // Verificação de ownership
    }
    return false;
  };

  const canEditGoat = (goat: GoatResponse): boolean => {
    return canEditFarm(goat.farm);
  };

  const canCreateFarm = (): boolean => {
    return isAuthenticated() && (isAdmin() || isFarmOwner() || isOperator());
  };

  const canAccessAdmin = (): boolean => {
    return isAdmin();
  };

  const canManageUsers = (): boolean => {
    return isAuthenticated() && (isAdmin() || isFarmOwner() || isOperator());
  };

  const canDeleteUser = (targetUserId: number): boolean => {
    if (!isAdmin()) return false;
    return targetUserId !== user?.id; // Admin não pode deletar a si mesmo
  };

  return {
    // Verificações de role
    isAdmin,
    isFarmOwner, 
    isOperator,
    isAuthenticated,
    
    // Verificações de permissões
    canEditFarm,
    canEditGoat,
    canCreateFarm,
    canAccessAdmin,
    canManageUsers,
    canDeleteUser,
  };
};
```

### 2. Service de Verificação de Endpoints (`services/PermissionService.ts`)

```typescript
class PermissionService {
  private publicEndpoints = [
    'GET:/api/goats',
    'GET:/api/genealogy', 
    'GET:/api/farms',
    'GET:/api/goatfarms',
    'POST:/api/auth/login',
    'POST:/api/auth/register-farm',
    'POST:/api/auth/refresh',
    'GET:/api/auth/me'
  ];

  /**
   * Verifica se um endpoint é público (não requer autenticação)
   */
  isPublicEndpoint(method: string, url: string): boolean {
    const endpoint = `${method.toUpperCase()}:${url}`;
    return this.publicEndpoints.some(pub => {
      // Suporte a wildcards com /**
      if (pub.endsWith('/**')) {
        const basePattern = pub.slice(0, -3);
        return endpoint.startsWith(basePattern);
      }
      return endpoint === pub || endpoint.startsWith(pub + '/');
    });
  }

  /**
   * Retorna headers de autenticação se necessário
   */
  getAuthHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Verifica se o usuário tem permissão para acessar um endpoint
   */
  hasPermissionForEndpoint(
    method: string, 
    url: string, 
    userRoles: string[] = []
  ): boolean {
    // Endpoints públicos sempre permitidos
    if (this.isPublicEndpoint(method, url)) {
      return true;
    }

    // Sem roles = sem permissão para endpoints protegidos
    if (userRoles.length === 0) {
      return false;
    }

    const endpoint = `${method.toUpperCase()}:${url}`;

    // Admin tem acesso a tudo
    if (userRoles.includes('ROLE_ADMIN')) {
      return true;
    }

    // Endpoints exclusivos de admin
    if (url.startsWith('/api/admin/')) {
      return false;
    }

    // Outros endpoints protegidos requerem FARM_OWNER ou OPERATOR
    return userRoles.some(role => 
      ['ROLE_FARM_OWNER', 'ROLE_OPERATOR'].includes(role)
    );
  }
}

export const permissionService = new PermissionService();
```

### 3. Componente de Proteção de Rotas (`components/ProtectedRoute.tsx`)

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallback = <div className="access-denied">Acesso negado</div>,
  redirectTo = '/login'
}) => {
  const { user, isLoading } = useAuth();
  
  // Aguardar carregamento da autenticação
  if (isLoading) {
    return <div className="loading">Carregando...</div>;
  }
  
  // Usuário não autenticado
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Verificar roles específicas se fornecidas
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.roles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
};

// Componentes específicos para roles comuns
export const AdminRoute: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
    {children}
  </ProtectedRoute>
);

export const FarmOwnerRoute: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <ProtectedRoute requiredRoles={['ROLE_FARM_OWNER', 'ROLE_OPERATOR', 'ROLE_ADMIN']}>
    {children}
  </ProtectedRoute>
);
```

### 4. Utility para Requisições HTTP (`utils/requestBackend.ts`)

```typescript
import { permissionService } from '@/services/PermissionService';
import { useAuth } from '@/contexts/AuthContext';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class RequestBackend {
  private baseURL = 'http://localhost:8080';
  private getToken: () => string | null;

  constructor(getTokenFn: () => string | null) {
    this.getToken = getTokenFn;
  }

  async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    const url = `${this.baseURL}${endpoint}`;
    
    // Verificar se endpoint é público
    const isPublic = permissionService.isPublicEndpoint(method, endpoint);
    const token = this.getToken();
    
    // Para endpoints protegidos, verificar se há token
    if (!isPublic && !token) {
      throw new Error('Token de autenticação necessário');
    }
    
    // Preparar headers
    const requestHeaders = {
      ...permissionService.getAuthHeaders(isPublic ? undefined : token || undefined),
      ...headers
    };
    
    // Preparar configuração da requisição
    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };
    
    // Adicionar body se necessário
    if (body && ['POST', 'PUT'].includes(method)) {
      config.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url, config);
      
      // Tratar erros HTTP
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado - Token inválido ou expirado');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado - Permissões insuficientes');
        }
        if (response.status === 404) {
          throw new Error('Recurso não encontrado');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
      }
      
      // Retornar resposta JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response.text() as any;
      
    } catch (error) {
      console.error(`Erro na requisição ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  // Métodos de conveniência
  get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

// Hook para usar o RequestBackend
export const useRequestBackend = () => {
  const { token } = useAuth();
  
  const requestBackend = new RequestBackend(() => token);
  
  return requestBackend;
};

// Instância global (para uso fora de componentes)
export const createRequestBackend = (getToken: () => string | null) => {
  return new RequestBackend(getToken);
};
```

### 5. Componentes de UI com Permissões

#### FarmCard com Controle de Permissões

```typescript
// components/FarmCard.tsx
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { GoatFarmResponse } from '@/types';

interface FarmCardProps {
  farm: GoatFarmResponse;
  onEdit?: (farm: GoatFarmResponse) => void;
  onDelete?: (farm: GoatFarmResponse) => void;
  onManageGoats?: (farm: GoatFarmResponse) => void;
}

export const FarmCard: React.FC<FarmCardProps> = ({ 
  farm, 
  onEdit, 
  onDelete, 
  onManageGoats 
}) => {
  const { canEditFarm, isAdmin } = usePermissions();
  
  const canEdit = canEditFarm(farm);
  
  return (
    <div className="farm-card">
      <div className="farm-header">
        <h3>{farm.name}</h3>
        <span className="farm-tod">TOD: {farm.tod}</span>
      </div>
      
      <div className="farm-info">
        <p><strong>Proprietário:</strong> {farm.user.name}</p>
        <p><strong>Email:</strong> {farm.user.email}</p>
        <p><strong>Cidade:</strong> {farm.address.city}/{farm.address.state}</p>
      </div>
      
      {/* Ações disponíveis para proprietários */}
      {canEdit && (
        <div className="farm-actions">
          <button 
            onClick={() => onEdit?.(farm)}
            className="btn btn-primary"
          >
            Editar Fazenda
          </button>
          
          <button 
            onClick={() => onManageGoats?.(farm)}
            className="btn btn-secondary"
          >
            Gerenciar Caprinos
          </button>
          
          <button 
            onClick={() => onDelete?.(farm)}
            className="btn btn-danger"
          >
            Excluir Fazenda
          </button>
        </div>
      )}
      
      {/* Ações administrativas (apenas para admins) */}
      {isAdmin() && (
        <div className="admin-actions">
          <button className="btn btn-warning">
            Ações Administrativas
          </button>
          
          <button className="btn btn-info">
            Ver Relatórios
          </button>
        </div>
      )}
      
      {/* Indicador visual de permissões */}
      <div className="permission-indicator">
        {canEdit ? (
          <span className="badge badge-success">Você pode editar</span>
        ) : (
          <span className="badge badge-secondary">Apenas visualização</span>
        )}
      </div>
    </div>
  );
};
```

#### Navegação com Controle de Acesso

```typescript
// components/Navigation.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

export const Navigation: React.FC = () => {
  const { 
    isAuthenticated, 
    canAccessAdmin, 
    canCreateFarm, 
    canManageUsers 
  } = usePermissions();
  const { user, logout } = useAuth();
  
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">GoatFarm</Link>
      </div>
      
      <div className="nav-links">
        {/* Links públicos */}
        <Link to="/farms">Fazendas</Link>
        <Link to="/goats">Caprinos</Link>
        <Link to="/genealogy">Genealogia</Link>
        
        {/* Links para usuários autenticados */}
        {isAuthenticated() && (
          <>
            {canCreateFarm() && (
              <Link to="/farms/create">Nova Fazenda</Link>
            )}
            
            {canManageUsers() && (
              <Link to="/users">Usuários</Link>
            )}
            
            {canAccessAdmin() && (
              <Link to="/admin" className="admin-link">
                Administração
              </Link>
            )}
          </>
        )}
      </div>
      
      <div className="nav-user">
        {isAuthenticated() ? (
          <div className="user-menu">
            <span>Olá, {user?.name}</span>
            <div className="user-roles">
              {user?.roles.map(role => (
                <span key={role} className="role-badge">
                  {role.replace('ROLE_', '')}
                </span>
              ))}
            </div>
            <button onClick={logout} className="btn btn-outline">
              Sair
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login">Entrar</Link>
            <Link to="/register">Cadastrar</Link>
          </div>
        )}
      </div>
    </nav>
  );
};
```

## 📊 Matriz Completa de Permissões

| Operação | Público | FARM_OWNER/OPERATOR | ADMIN |
|----------|---------|---------------------|-------|
| **Visualizar fazendas** | ✅ | ✅ | ✅ |
| **Visualizar caprinos** | ✅ | ✅ | ✅ |
| **Visualizar genealogia** | ✅ | ✅ | ✅ |
| **Criar conta** | ✅ | ✅ | ✅ |
| **Login/Logout** | ✅ | ✅ | ✅ |
| **Refresh token** | ✅ | ✅ | ✅ |
| **Ver perfil próprio** | ❌ | ✅ | ✅ |
| **Criar fazenda** | ❌ | ✅ | ✅ |
| **Editar própria fazenda** | ❌ | ✅ | ✅ |
| **Editar fazenda alheia** | ❌ | ❌ | ✅ |
| **Deletar própria fazenda** | ❌ | ✅ | ✅ |
| **Deletar fazenda alheia** | ❌ | ❌ | ✅ |
| **Criar caprinos próprios** | ❌ | ✅ | ✅ |
| **Editar caprinos próprios** | ❌ | ✅ | ✅ |
| **Editar caprinos alheios** | ❌ | ❌ | ✅ |
| **Deletar caprinos próprios** | ❌ | ✅ | ✅ |
| **Deletar caprinos alheios** | ❌ | ❌ | ✅ |
| **Listar usuários** | ❌ | ✅ | ✅ |
| **Criar usuários** | ❌ | ✅ | ✅ |
| **Editar usuários** | ❌ | ✅ | ✅ |
| **Deletar usuários** | ❌ | ❌ | ✅ |
| **Gerenciar roles** | ❌ | ❌ | ✅ |
| **Acessar painel admin** | ❌ | ❌ | ✅ |
| **Ver relatórios** | ❌ | ❌ | ✅ |
| **Limpar banco de dados** | ❌ | ❌ | ✅ |

## 🔄 Fluxo de Verificação de Ownership

O sistema implementa verificação automática de ownership em duas camadas:

### 1. **Frontend (Preventivo)**
- Verifica roles do usuário antes de exibir botões/links
- Compara `farm.userId` com `user.id` para ownership
- Oculta funcionalidades não permitidas

### 2. **Backend (Definitivo)**
- `OwnershipService` verifica permissões em tempo real
- Valida JWT e extrai informações do usuário
- Compara ownership antes de executar operações
- Retorna erro 403 se não autorizado

### Exemplo de Fluxo Completo:

```
1. Usuário clica em "Editar Fazenda"
2. Frontend verifica: canEditFarm(farm) → true/false
3. Se true, exibe formulário de edição
4. Usuário submete alterações
5. Frontend envia PUT /api/goatfarms/{id} com JWT
6. Backend valida JWT e extrai userId
7. OwnershipService verifica se farm.userId === token.userId
8. Se válido, executa operação
9. Se inválido, retorna 403 Forbidden
```

## 🚀 Endpoints Principais por Categoria

### **Autenticação**
- `POST /api/auth/login` - Login (público)
- `POST /api/auth/refresh` - Renovar token (público)
- `GET /api/auth/me` - Perfil atual (autenticado)
- `POST /api/auth/register-farm` - Registro completo (público)

### **Fazendas**
- `GET /api/goatfarms` - Listar fazendas (público)
- `GET /api/goatfarms/{id}` - Detalhes da fazenda (público)
- `POST /api/goatfarms` - Criar fazenda (FARM_OWNER+)
- `PUT /api/goatfarms/{id}` - Editar fazenda (ownership)
- `DELETE /api/goatfarms/{id}` - Deletar fazenda (ownership)

### **Caprinos**
- `GET /api/goats` - Listar caprinos (público)
- `GET /api/goats/{registrationNumber}` - Detalhes do caprino (público)
- `POST /api/goats` - Criar caprino (FARM_OWNER+)
- `PUT /api/goats/{registrationNumber}` - Editar caprino (ownership)
- `DELETE /api/goats/{registrationNumber}` - Deletar caprino (ownership)

### **Usuários**
- `GET /api/users` - Listar usuários (FARM_OWNER+)
- `POST /api/users` - Criar usuário (FARM_OWNER+)
- `PUT /api/users/{id}` - Editar usuário (FARM_OWNER+)
- `DELETE /api/users/{id}` - Deletar usuário (ADMIN)

### **Administração**
- `GET /api/admin/users` - Gerenciar usuários (ADMIN)
- `POST /api/admin/clean-database` - Limpar banco (ADMIN)
- `GET /api/admin/stats` - Estatísticas (ADMIN)

## 🎯 Boas Práticas de Implementação

### 1. **Segurança em Camadas**
```typescript
// ❌ Ruim: Apenas verificação no frontend
if (user.roles.includes('ROLE_ADMIN')) {
  // Exibir botão admin
}

// ✅ Bom: Verificação no frontend + backend
if (canAccessAdmin()) {
  // Exibir botão admin (frontend)
  // Backend ainda validará permissões na requisição
}
```

### 2. **Tratamento de Erros**
```typescript
try {
  await requestBackend.put(`/api/goatfarms/${farmId}`, updateData);
} catch (error) {
  if (error.message.includes('403')) {
    showError('Você não tem permissão para editar esta fazenda');
  } else if (error.message.includes('401')) {
    // Redirecionar para login
    logout();
  } else {
    showError('Erro ao atualizar fazenda');
  }
}
```

### 3. **Feedback Visual**
```typescript
// Indicar claramente o que o usuário pode fazer
<div className="farm-card">
  {canEditFarm(farm) ? (
    <div className="owner-badge">Sua fazenda</div>
  ) : (
    <div className="readonly-badge">Apenas visualização</div>
  )}
</div>
```

### 4. **Loading States**
```typescript
const { user, isLoading } = useAuth();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!user) {
  return <Navigate to="/login" />;
}
```

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente
```env
# .env.development
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_JWT_STORAGE_KEY=goatfarm_token
REACT_APP_REFRESH_TOKEN_KEY=goatfarm_refresh_token
```

### Configuração de Proxy (se necessário)
```json
// package.json
{
  "proxy": "http://localhost:8080"
}
```

### CORS no Backend
O backend já está configurado com CORS habilitado para desenvolvimento.

---

**Este documento serve como referência completa para implementação de autenticação e autorização no frontend do GoatFarm. Todas as verificações de permissão devem seguir os padrões aqui estabelecidos para garantir consistência e segurança.**