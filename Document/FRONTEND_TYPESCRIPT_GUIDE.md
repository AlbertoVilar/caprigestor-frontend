# Guia Completo para Frontend TypeScript - Sistema GoatFarm

## 📋 Índice
1. [Visão Geral da API](#visão-geral-da-api)
2. [Sistema de Autenticação](#sistema-de-autenticação)
3. [Estrutura de Dados (DTOs)](#estrutura-de-dados-dtos)
4. [Endpoints da API](#endpoints-da-api)
5. [Sistema de Permissões](#sistema-de-permissões)
6. [Implementação TypeScript](#implementação-typescript)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral da API

O backend GoatFarm é uma API REST construída com Spring Boot que implementa um sistema completo de gestão de fazendas de caprinos com:

- **Arquitetura em Camadas**: Controller → Facade → Business → DAO → Repository
- **Segurança JWT**: Autenticação stateless com tokens RSA
- **Controle de Acesso**: Sistema baseado em roles (RBAC) + verificação de ownership
- **Modelo de Dados**: Agregados com relacionamentos bem definidos
- **Tratamento de Exceções**: GlobalExceptionHandler centralizado

### Base URL
```
http://localhost:8080/api
```

---

## 🔐 Sistema de Autenticação

### ⚠️ IMPORTANTE - Controle de Acesso
**Consulte o arquivo `ENDPOINTS_ACESSO_PUBLICO_RESTRITO.md` para a definição completa e definitiva de quais endpoints são públicos vs restritos.**

### Fluxo de Autenticação

1. **Login**: `POST /api/auth/login`
2. **Refresh Token**: `POST /api/auth/refresh`
3. **Registro de Fazenda**: `POST /api/auth/register-farm`
4. **Usuário Atual**: `GET /api/auth/me`

### Tipos TypeScript para Autenticação

```typescript
// Interfaces de Request
interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// Interfaces de Response
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // segundos
  user: UserResponse;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  cpf: string;
  roles: string[]; // ["ROLE_FARM_OWNER", "ROLE_ADMIN", etc.]
}
```

### Implementação do Serviço de Autenticação

```typescript
class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  private tokenKey = 'goatfarm_access_token';
  private refreshTokenKey = 'goatfarm_refresh_token';

  // Endpoints que NÃO precisam de autenticação
  private readonly PUBLIC_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/register-farm',
  ];

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas');
    }

    const data: LoginResponse = await response.json();
    
    // Armazenar tokens
    localStorage.setItem(this.tokenKey, data.accessToken);
    localStorage.setItem(this.refreshTokenKey, data.refreshToken);
    
    return data;
  }

  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Token expirado');
    }

    const data: LoginResponse = await response.json();
    localStorage.setItem(this.tokenKey, data.accessToken);
    localStorage.setItem(this.refreshTokenKey, data.refreshToken);
    
    return data;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Verifica se endpoint é público
  isPublicEndpoint(url: string, method: string): boolean {
    // Todos os endpoints GET são públicos (visualização do catálogo)
    if (method === 'GET') {
      return true;
    }
    
    // Endpoints específicos de auth são públicos
    return this.PUBLIC_ENDPOINTS.some(endpoint => url.startsWith(endpoint));
  }

  // Retorna headers de auth apenas para endpoints protegidos
  getAuthHeaders(url: string = '', method: string = 'GET'): Record<string, string> {
    if (this.isPublicEndpoint(url, method)) {
      return {}; // Sem token para endpoints públicos
    }
    
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
```

---

## 📊 Estrutura de Dados (DTOs)

### Fazenda (GoatFarm)

```typescript
// Request DTOs
interface GoatFarmFullRequest {
  farm: GoatFarmRequest;
  address: AddressRequest;
  phones: PhoneRequest[];
  user: UserRequest;
}

interface GoatFarmRequest {
  name: string;
  description?: string;
  totalArea?: number;
  establishedDate?: string; // ISO date
}

interface GoatFarmUpdateRequest {
  name?: string;
  description?: string;
  totalArea?: number;
  establishedDate?: string;
}

// Response DTOs
interface GoatFarmFullResponse {
  farm: GoatFarmResponse;
  address: AddressResponse;
  phones: PhoneResponse[];
  user: UserResponse;
}

interface GoatFarmResponse {
  id: number;
  name: string;
  description?: string;
  totalArea?: number;
  establishedDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
}
```

### Endereço (Address)

```typescript
interface AddressRequest {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressResponse extends AddressRequest {
  id: number;
}
```

### Telefone (Phone)

```typescript
interface PhoneRequest {
  number: string;
  type: PhoneType;
}

interface PhoneResponse extends PhoneRequest {
  id: number;
}

enum PhoneType {
  MOBILE = 'MOBILE',
  LANDLINE = 'LANDLINE',
  WHATSAPP = 'WHATSAPP'
}
```

### Caprino (Goat)

```typescript
interface GoatRequest {
  registrationNumber: string;
  name: string;
  breed?: string;
  gender: GoatGender;
  birthDate?: string; // ISO date
  weight?: number;
  color?: string;
  observations?: string;
  farmId: number;
  fatherId?: string; // registration number
  motherId?: string; // registration number
}

interface GoatResponse extends Omit<GoatRequest, 'farmId'> {
  id: number;
  farm: GoatFarmResponse;
  father?: GoatResponse;
  mother?: GoatResponse;
  children?: GoatResponse[];
  events?: EventResponse[];
  createdAt: string;
  updatedAt: string;
}

enum GoatGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}
```

### Usuário (User)

```typescript
interface UserRequest {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmPassword: string;
  roles: string[];
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  cpf: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Eventos (Event)

```typescript
interface EventRequest {
  eventType: EventType;
  eventDate: string; // ISO date
  description?: string;
  observations?: string;
}

interface EventResponse extends EventRequest {
  id: number;
  goat: GoatResponse;
  createdAt: string;
  updatedAt: string;
}

enum EventType {
  BIRTH = 'BIRTH',
  VACCINATION = 'VACCINATION',
  MEDICAL_TREATMENT = 'MEDICAL_TREATMENT',
  BREEDING = 'BREEDING',
  SALE = 'SALE',
  DEATH = 'DEATH',
  OTHER = 'OTHER'
}
```

---

## 🛣️ Endpoints da API

### Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|-------------|
| POST | `/login` | Login do usuário | ❌ |
| POST | `/refresh` | Renovar token | ❌ |
| POST | `/register-farm` | Cadastro completo de fazenda | ❌ |
| GET | `/me` | Dados do usuário atual | ✅ |

### Fazendas (`/api/farms`)

| Método | Endpoint | Descrição | Autenticação | Permissão |
|--------|----------|-----------|-------------|----------|
| GET | `/` | Listar fazendas (paginado) | ❌ | Público |
| GET | `/{id}` | Buscar fazenda por ID | ❌ | Público |
| GET | `/search` | Buscar por nome | ❌ | Público |
| POST | `/` | Criar fazenda | ✅ | FARM_OWNER, ADMIN |
| PUT | `/{id}` | Atualizar fazenda | ✅ | Owner + FARM_OWNER, ADMIN |
| DELETE | `/{id}` | Deletar fazenda | ✅ | Owner + FARM_OWNER, ADMIN |

**Nota**: Endpoints GET são públicos para permitir visualização do catálogo. Endpoints de modificação (POST/PUT/DELETE) requerem autenticação e verificação de propriedade.

### Caprinos (`/api/goats`)

| Método | Endpoint | Descrição | Autenticação | Permissão |
|--------|----------|-----------|-------------|----------|
| GET | `/` | Listar caprinos (paginado) | ❌ | Público |
| GET | `/{registrationNumber}` | Buscar por registro | ❌ | Público |
| GET | `/search` | Buscar por nome | ❌ | Público |
| GET | `/farm/{farmId}` | Caprinos de uma fazenda | ❌ | Público |
| POST | `/` | Criar caprino | ✅ | Owner + FARM_OWNER, ADMIN |
| PUT | `/{registrationNumber}` | Atualizar caprino | ✅ | Owner + FARM_OWNER, ADMIN |
| DELETE | `/{registrationNumber}` | Deletar caprino | ✅ | Owner + FARM_OWNER, ADMIN |

### Eventos (`/api/events`)

| Método | Endpoint | Descrição | Autenticação | Permissão |
|--------|----------|-----------|-------------|----------|
| GET | `/goat/{registrationNumber}` | Eventos de um caprino | ❌ | Público |
| POST | `/goat/{registrationNumber}` | Criar evento | ✅ | Owner + FARM_OWNER, ADMIN |
| PUT | `/{id}/goat/{registrationNumber}` | Atualizar evento | ✅ | Owner + FARM_OWNER, ADMIN |
| DELETE | `/{id}` | Deletar evento | ✅ | Owner + FARM_OWNER, ADMIN |

### Genealogia (`/api/genealogy`)

| Método | Endpoint | Descrição | Autenticação | Permissão |
|--------|----------|-----------|-------------|----------|
| GET | `/{registrationNumber}/ancestors` | Ancestrais | ❌ | Público |
| GET | `/{registrationNumber}/descendants` | Descendentes | ❌ | Público |
| GET | `/{registrationNumber}/siblings` | Irmãos | ❌ | Público |

### Administração (`/api/admin`)

| Método | Endpoint | Descrição | Autenticação | Permissão |
|--------|----------|-----------|-------------|----------|
| GET | `/users` | Listar usuários | ✅ | ADMIN |
| GET | `/users/{id}` | Buscar usuário | ✅ | ADMIN |
| PUT | `/users/{id}` | Atualizar usuário | ✅ | ADMIN |
| DELETE | `/users/{id}` | Deletar usuário | ✅ | ADMIN |

---

## 🔒 Sistema de Permissões

### Roles Disponíveis

1. **ROLE_ADMIN**: Acesso total ao sistema
2. **ROLE_FARM_OWNER**: Proprietário de fazenda
3. **ROLE_OPERATOR**: Operador (futuro)

### Modelo de Segurança: "Registro Público, Gestão Protegida"

- **Leitura (GET)**: Todos os recursos são públicos
- **Escrita (POST/PUT/DELETE)**: Requer autenticação + permissão + ownership

### Verificação de Ownership

O sistema verifica se o usuário autenticado tem permissão para modificar o recurso:

```typescript
// Exemplo de verificação no frontend
class PermissionService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  canEditFarm(farm: GoatFarmResponse): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // Admin pode editar qualquer fazenda
    if (user.roles.includes('ROLE_ADMIN')) return true;

    // Proprietário pode editar apenas sua fazenda
    if (user.roles.includes('ROLE_FARM_OWNER')) {
      return farm.userId === user.id;
    }

    return false;
  }

  canEditGoat(goat: GoatResponse): boolean {
    return this.canEditFarm(goat.farm);
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles.includes('ROLE_ADMIN') || false;
  }
}
```

---

## 💻 Implementação TypeScript

### Serviço Base para API

```typescript
class ApiService {
  private baseUrl = 'http://localhost:8080/api';
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    // Usa headers de auth apenas para endpoints protegidos
    const authHeaders = this.authService.getAuthHeaders(endpoint, method);

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Só tenta renovar token se não for endpoint público
        if (!this.authService.isPublicEndpoint(endpoint, method)) {
          try {
            await this.authService.refreshToken();
            // Repetir a requisição com novo token
            const newAuthHeaders = this.authService.getAuthHeaders(endpoint, method);
            config.headers = {
              ...config.headers,
              ...newAuthHeaders,
            };
            const retryResponse = await fetch(url, config);
            if (!retryResponse.ok) {
              throw new Error(`HTTP ${retryResponse.status}`);
            }
            return await retryResponse.json();
          } catch {
            this.authService.logout();
            throw new Error('Sessão expirada');
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.message || 'Erro na API');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error('Erro de conexão');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Serviços Específicos

```typescript
// Serviço de Fazendas
class FarmService {
  constructor(private apiService: ApiService) {}

  async getFarms(page = 0, size = 20): Promise<PageResponse<GoatFarmFullResponse>> {
    return this.apiService.get(`/farms?page=${page}&size=${size}`);
  }

  async getFarmById(id: number): Promise<GoatFarmFullResponse> {
    return this.apiService.get(`/farms/${id}`);
  }

  async searchFarms(name: string, page = 0, size = 20): Promise<PageResponse<GoatFarmFullResponse>> {
    return this.apiService.get(`/farms/search?name=${encodeURIComponent(name)}&page=${page}&size=${size}`);
  }

  async createFarm(farm: GoatFarmFullRequest): Promise<GoatFarmFullResponse> {
    return this.apiService.post('/auth/register-farm', farm);
  }

  async updateFarm(id: number, farm: GoatFarmUpdateRequest): Promise<GoatFarmFullResponse> {
    return this.apiService.put(`/farms/${id}`, farm);
  }

  async deleteFarm(id: number): Promise<void> {
    return this.apiService.delete(`/farms/${id}`);
  }
}

// Serviço de Caprinos
class GoatService {
  constructor(private apiService: ApiService) {}

  async getGoats(page = 0, size = 20): Promise<PageResponse<GoatResponse>> {
    return this.apiService.get(`/goats?page=${page}&size=${size}`);
  }

  async getGoatByRegistration(registrationNumber: string): Promise<GoatResponse> {
    return this.apiService.get(`/goats/${registrationNumber}`);
  }

  async getGoatsByFarm(farmId: number, page = 0, size = 20): Promise<PageResponse<GoatResponse>> {
    return this.apiService.get(`/goats/farm/${farmId}?page=${page}&size=${size}`);
  }

  async searchGoats(name: string, page = 0, size = 20): Promise<PageResponse<GoatResponse>> {
    return this.apiService.get(`/goats/search?name=${encodeURIComponent(name)}&page=${page}&size=${size}`);
  }

  async createGoat(goat: GoatRequest): Promise<GoatResponse> {
    return this.apiService.post('/goats', goat);
  }

  async updateGoat(registrationNumber: string, goat: Partial<GoatRequest>): Promise<GoatResponse> {
    return this.apiService.put(`/goats/${registrationNumber}`, goat);
  }

  async deleteGoat(registrationNumber: string): Promise<void> {
    return this.apiService.delete(`/goats/${registrationNumber}`);
  }
}

// Interface para paginação
interface PageResponse<T> {
  content: T[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageSize: number;
    pageNumber: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
```

---

## ⚠️ Tratamento de Erros

### Tipos de Erro do Backend

```typescript
interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

interface ValidationErrorResponse extends ApiErrorResponse {
  errors: {
    [field: string]: string;
  };
}
```

### Códigos de Status Comuns

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos (ValidationError)
- **401**: Não autenticado
- **403**: Sem permissão
- **404**: Recurso não encontrado
- **409**: Conflito (ex: email já existe)
- **500**: Erro interno do servidor

### Implementação de Tratamento

```typescript
class ErrorHandler {
  static handle(error: any): string {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          return 'Dados inválidos. Verifique os campos preenchidos.';
        case 401:
          return 'Sessão expirada. Faça login novamente.';
        case 403:
          return 'Você não tem permissão para esta ação.';
        case 404:
          return 'Recurso não encontrado.';
        case 409:
          return 'Conflito: dados já existem no sistema.';
        case 500:
          return 'Erro interno do servidor. Tente novamente mais tarde.';
        default:
          return error.message || 'Erro desconhecido.';
      }
    }
    return 'Erro de conexão. Verifique sua internet.';
  }

  static handleValidation(error: ValidationErrorResponse): Record<string, string> {
    return error.errors || {};
  }
}
```

---

## 🚀 Exemplos Práticos

### 1. Login e Autenticação

```typescript
// Componente de Login
class LoginComponent {
  private authService = new AuthService();

  async handleLogin(email: string, password: string) {
    try {
      const response = await this.authService.login({ email, password });
      console.log('Login realizado:', response.user);
      // Redirecionar para dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Erro no login:', ErrorHandler.handle(error));
      // Mostrar erro na UI
    }
  }
}
```

### 2. Listagem de Fazendas com Paginação

```typescript
class FarmListComponent {
  private farmService: FarmService;
  private farms: GoatFarmFullResponse[] = [];
  private currentPage = 0;
  private totalPages = 0;

  constructor(apiService: ApiService) {
    this.farmService = new FarmService(apiService);
  }

  async loadFarms(page = 0) {
    try {
      const response = await this.farmService.getFarms(page, 10);
      this.farms = response.content;
      this.currentPage = response.number;
      this.totalPages = response.totalPages;
      this.renderFarms();
    } catch (error) {
      console.error('Erro ao carregar fazendas:', ErrorHandler.handle(error));
    }
  }

  async searchFarms(query: string) {
    if (!query.trim()) {
      return this.loadFarms();
    }

    try {
      const response = await this.farmService.searchFarms(query, 0, 10);
      this.farms = response.content;
      this.renderFarms();
    } catch (error) {
      console.error('Erro na busca:', ErrorHandler.handle(error));
    }
  }

  private renderFarms() {
    // Implementar renderização na UI
  }
}
```

### 3. Cadastro de Caprino com Validação

```typescript
class GoatFormComponent {
  private goatService: GoatService;
  private permissionService: PermissionService;

  constructor(apiService: ApiService, authService: AuthService) {
    this.goatService = new GoatService(apiService);
    this.permissionService = new PermissionService(authService);
  }

  async handleSubmit(formData: GoatRequest) {
    // Validar permissões
    if (!this.permissionService.canEditFarm({ userId: formData.farmId } as any)) {
      alert('Você não tem permissão para adicionar caprinos nesta fazenda.');
      return;
    }

    try {
      // Validar dados localmente
      this.validateGoatData(formData);

      const newGoat = await this.goatService.createGoat(formData);
      console.log('Caprino criado:', newGoat);
      // Redirecionar ou atualizar lista
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        // Tratar erros de validação
        const validationErrors = ErrorHandler.handleValidation(error as any);
        this.showValidationErrors(validationErrors);
      } else {
        console.error('Erro ao criar caprino:', ErrorHandler.handle(error));
      }
    }
  }

  private validateGoatData(data: GoatRequest) {
    if (!data.registrationNumber?.trim()) {
      throw new Error('Número de registro é obrigatório');
    }
    if (!data.name?.trim()) {
      throw new Error('Nome é obrigatório');
    }
    if (!data.gender) {
      throw new Error('Gênero é obrigatório');
    }
  }

  private showValidationErrors(errors: Record<string, string>) {
    // Implementar exibição de erros na UI
  }
}
```

### 4. Dashboard com Estatísticas

```typescript
class DashboardComponent {
  private farmService: FarmService;
  private goatService: GoatService;
  private authService: AuthService;

  constructor(apiService: ApiService, authService: AuthService) {
    this.farmService = new FarmService(apiService);
    this.goatService = new GoatService(apiService);
    this.authService = authService;
  }

  async loadDashboard() {
    try {
      const user = await this.authService.getCurrentUser();
      
      if (user.roles.includes('ROLE_ADMIN')) {
        await this.loadAdminDashboard();
      } else {
        await this.loadOwnerDashboard(user);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', ErrorHandler.handle(error));
    }
  }

  private async loadAdminDashboard() {
    // Carregar estatísticas gerais
    const farms = await this.farmService.getFarms(0, 100);
    const goats = await this.goatService.getGoats(0, 100);
    
    this.renderStats({
      totalFarms: farms.totalElements,
      totalGoats: goats.totalElements,
    });
  }

  private async loadOwnerDashboard(user: UserResponse) {
    // Carregar dados específicos do proprietário
    // Implementar lógica específica
  }

  private renderStats(stats: any) {
    // Implementar renderização das estatísticas
  }
}
```

---

## 📝 Checklist de Implementação

### ✅ Autenticação
- [ ] Implementar serviço de autenticação
- [ ] Gerenciar tokens (access + refresh)
- [ ] Interceptar requisições para adicionar Authorization header
- [ ] Tratar renovação automática de tokens
- [ ] Implementar logout

### ✅ Serviços da API
- [ ] Criar serviço base (ApiService)
- [ ] Implementar FarmService
- [ ] Implementar GoatService
- [ ] Implementar EventService
- [ ] Implementar GenealogyService
- [ ] Implementar AdminService

### ✅ Interfaces TypeScript
- [ ] Definir todas as interfaces de Request
- [ ] Definir todas as interfaces de Response
- [ ] Definir enums (GoatGender, EventType, PhoneType)
- [ ] Definir interface de paginação
- [ ] Definir interfaces de erro

### ✅ Componentes da UI
- [ ] Componente de Login
- [ ] Lista de Fazendas (com busca e paginação)
- [ ] Formulário de Fazenda
- [ ] Lista de Caprinos (com filtros)
- [ ] Formulário de Caprino
- [ ] Visualização de Genealogia
- [ ] Dashboard com estatísticas
- [ ] Painel administrativo

### ✅ Tratamento de Erros
- [ ] Implementar ErrorHandler
- [ ] Tratar erros de validação
- [ ] Tratar erros de permissão
- [ ] Tratar erros de conexão
- [ ] Implementar feedback visual de erros

### ✅ Permissões e Segurança
- [ ] Implementar PermissionService
- [ ] Verificar permissões antes de ações
- [ ] Ocultar/desabilitar elementos baseado em permissões
- [ ] Implementar guards de rota (se usando SPA)

---

## 🔧 Configurações Adicionais

### CORS
O backend já está configurado para aceitar requisições de:
- `http://localhost:3000` (React)
- `http://localhost:5173` (Vite)
- `http://localhost:5174` (Vite alternativo)
- `http://localhost:5500` (Live Server)
- `http://127.0.0.1:5500` (Live Server)

### Headers Obrigatórios
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` // quando autenticado
};
```

### Formato de Datas
Todas as datas devem ser enviadas no formato ISO 8601:
```typescript
const date = new Date().toISOString(); // "2025-01-27T10:30:00.000Z"
```

---

**Este guia fornece uma base completa para implementar o frontend TypeScript integrado com o backend GoatFarm. Adapte conforme necessário para seu framework específico (React, Vue, Angular, etc.).**