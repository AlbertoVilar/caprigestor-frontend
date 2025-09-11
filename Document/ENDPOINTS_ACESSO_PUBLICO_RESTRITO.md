# 🔐 Controle de Acesso - Endpoints Públicos vs Restritos

## 📋 Resumo Executivo

**IMPORTANTE:** Este documento resolve conflitos de documentação anterior e estabelece definitivamente quais endpoints são públicos e quais requerem autenticação.

---

## 🌐 ENDPOINTS PÚBLICOS (Sem Autenticação)

### AuthController - Autenticação
```typescript
// ✅ PÚBLICO - Qualquer pessoa pode acessar
POST /api/auth/login
POST /api/auth/register
```

### GoatFarmController - Visualização Pública
```typescript
// ✅ PÚBLICO - Qualquer pessoa pode visualizar fazendas
GET /api/farms                    // Listar todas as fazendas (paginado)
GET /api/farms/search?query=...   // Buscar fazendas por nome
GET /api/farms/{id}               // Detalhes de uma fazenda específica
```

**Justificativa:** O modelo é "Registro Público, Gestão Protegida" - qualquer pessoa pode ver as fazendas cadastradas, mas apenas proprietários podem gerenciá-las.

---

## 🔒 ENDPOINTS RESTRITOS (Requerem Autenticação)

### 1. GoatFarmController - Gestão de Fazendas

#### 🏠 FARM_OWNER ou ADMIN
```typescript
// Criação e gestão de fazendas
POST /api/farms                   // Criar nova fazenda
PUT /api/farms/{id}               // Atualizar fazenda (apenas proprietário)
DELETE /api/farms/{id}            // Deletar fazenda (apenas proprietário)

// Gestão de caprinos
POST /api/farms/{farmId}/goats    // Adicionar caprino à fazenda
GET /api/farms/{farmId}/goats     // Listar caprinos da fazenda (proprietário)
```

**Validação de Ownership:** O sistema verifica se o usuário autenticado é proprietário da fazenda antes de permitir operações de gestão.

### 2. GoatController - Gestão de Caprinos

#### 🐐 FARM_OWNER ou ADMIN
```typescript
// CRUD de caprinos
POST /api/goats                   // Criar caprino
GET /api/goats/{registrationNumber} // Detalhes do caprino (apenas proprietário)
PUT /api/goats/{registrationNumber} // Atualizar caprino (apenas proprietário)
DELETE /api/goats/{registrationNumber} // Deletar caprino (apenas proprietário)

// Busca e listagem
GET /api/goats/search?query=...   // Buscar caprinos (apenas do usuário)
GET /api/goats/farm/{farmId}      // Caprinos de uma fazenda (apenas proprietário)
```

### 3. EventController - Gestão de Eventos

#### 📅 FARM_OWNER ou ADMIN
```typescript
// Gestão de eventos dos caprinos
POST /api/events                  // Registrar evento
GET /api/events/goat/{registrationNumber} // Histórico de eventos (apenas proprietário)
PUT /api/events/{id}              // Atualizar evento (apenas proprietário)
DELETE /api/events/{id}           // Deletar evento (apenas proprietário)
```

### 4. UserController - Gestão de Perfil

#### 👤 Usuário Autenticado (próprio perfil)
```typescript
// Gestão do próprio perfil
GET /api/users/profile            // Ver próprio perfil
PUT /api/users/profile            // Atualizar próprio perfil
DELETE /api/users/profile         // Deletar própria conta

// Gestão de endereços e telefones
POST /api/users/addresses         // Adicionar endereço
PUT /api/users/addresses/{id}     // Atualizar endereço
DELETE /api/users/addresses/{id}  // Deletar endereço

POST /api/users/phones            // Adicionar telefone
PUT /api/users/phones/{id}        // Atualizar telefone
DELETE /api/users/phones/{id}     // Deletar telefone
```

### 5. AdminController - Administração

#### 👑 APENAS ADMIN
```typescript
// Gestão de usuários
GET /api/admin/users              // Listar todos os usuários
GET /api/admin/users/{id}         // Detalhes de qualquer usuário
PUT /api/admin/users/{id}         // Atualizar qualquer usuário
DELETE /api/admin/users/{id}      // Deletar qualquer usuário
POST /api/admin/users/{id}/roles  // Gerenciar roles de usuários

// Relatórios e estatísticas
GET /api/admin/stats              // Estatísticas do sistema
GET /api/admin/reports            // Relatórios administrativos
```

---

## 🛡️ Sistema de Permissões Detalhado

### Hierarquia de Roles
```
ADMIN > FARM_OWNER > USER (não autenticado)
```

### Matriz de Permissões

| Operação | Público | FARM_OWNER | ADMIN |
|----------|---------|------------|---------|
| **Visualizar fazendas** | ✅ | ✅ | ✅ |
| **Criar conta** | ✅ | ✅ | ✅ |
| **Login** | ✅ | ✅ | ✅ |
| **Criar fazenda** | ❌ | ✅ | ✅ |
| **Editar própria fazenda** | ❌ | ✅ | ✅ |
| **Editar fazenda de outros** | ❌ | ❌ | ✅ |
| **Gerenciar caprinos** | ❌ | ✅ (próprios) | ✅ (todos) |
| **Administrar usuários** | ❌ | ❌ | ✅ |

### Validação de Ownership

```typescript
// Exemplo de verificação no backend
public boolean canEditFarm(User user, GoatFarm farm) {
    // Admin pode editar qualquer fazenda
    if (user.hasRole("ROLE_ADMIN")) {
        return true;
    }
    
    // Farm Owner pode editar apenas suas fazendas
    if (user.hasRole("ROLE_FARM_OWNER")) {
        return farm.getUserId().equals(user.getId());
    }
    
    return false;
}
```

---

## 🔧 Implementação no Frontend TypeScript

### AuthService - Verificação de Acesso
```typescript
class AuthService {
  // Endpoints que NÃO precisam de token
  private publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/farms',           // GET apenas
    '/api/farms/search',    // GET apenas
  ];

  isPublicEndpoint(url: string, method: string): boolean {
    if (method === 'GET' && url.startsWith('/api/farms')) {
      return true; // Visualização de fazendas é pública
    }
    
    return this.publicEndpoints.some(endpoint => 
      url.startsWith(endpoint)
    );
  }

  shouldAddAuthHeader(url: string, method: string): boolean {
    return !this.isPublicEndpoint(url, method);
  }
}
```

### ApiService - Interceptor de Requisições
```typescript
class ApiService {
  constructor(private authService: AuthService) {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use((config) => {
      const { url = '', method = 'GET' } = config;
      
      // Adiciona token apenas para endpoints protegidos
      if (this.authService.shouldAddAuthHeader(url, method.toUpperCase())) {
        const token = this.authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      
      return config;
    });
  }
}
```

### Guards de Rota
```typescript
// Componente para rotas que precisam de autenticação
const ProtectedRoute: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Componente para rotas administrativas
const AdminRoute: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user?.roles.includes('ROLE_ADMIN')) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

---

## 📝 Resumo das Regras de Acesso

### ✅ SEM AUTENTICAÇÃO (Público)
- **Login e Registro:** Qualquer pessoa pode criar conta e fazer login
- **Visualização de Fazendas:** Qualquer pessoa pode ver a lista e detalhes das fazendas
- **Busca de Fazendas:** Qualquer pessoa pode buscar fazendas por nome

### 🔒 COM AUTENTICAÇÃO (Restrito)
- **Gestão de Fazendas:** Apenas proprietários podem criar, editar e deletar suas fazendas
- **Gestão de Caprinos:** Apenas proprietários podem gerenciar caprinos de suas fazendas
- **Gestão de Eventos:** Apenas proprietários podem registrar eventos de seus caprinos
- **Perfil de Usuário:** Apenas o próprio usuário pode gerenciar seu perfil
- **Administração:** Apenas ADMINs podem gerenciar outros usuários e acessar relatórios

### 🎯 Modelo de Negócio
**"Registro Público, Gestão Protegida"**
- Promove transparência e descoberta de fazendas
- Protege a gestão e dados sensíveis
- Facilita networking entre criadores
- Mantém controle sobre propriedade dos dados

---

**Este documento é a referência definitiva para implementação do controle de acesso no sistema GoatFarm.**