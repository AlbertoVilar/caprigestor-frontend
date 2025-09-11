# Instruções Detalhadas para Desenvolvimento do Frontend

## Visão Geral do Sistema

O sistema GoatFarm é uma aplicação de gestão de fazendas de cabras com arquitetura "Registro Público, Gestão Protegida". O frontend deve implementar uma interface completa para interagir com todos os endpoints do backend.

## Estrutura da API Backend

### Base URL
```
http://localhost:8080/api
```

## 1. AUTENTICAÇÃO E AUTORIZAÇÃO

### 1.1 Endpoints de Autenticação

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Payload**:
```json
{
  "email": "string (obrigatório, formato email)",
  "password": "string (obrigatório)"
}
```
- **Resposta**:
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "roles": ["ROLE_ADMIN", "ROLE_OPERATOR"]
  }
}
```

#### Registro de Fazenda Completa
- **Endpoint**: `POST /api/auth/register`
- **Payload**:
```json
{
  "farm": {
    "name": "string (3-100 caracteres)",
    "cnpj": "string (14 dígitos)",
    "stateRegistration": "string (opcional)",
    "municipalRegistration": "string (opcional)"
  },
  "user": {
    "name": "string (3-100 caracteres)",
    "email": "string (formato email)",
    "password": "string (mín 6 caracteres)",
    "confirmPassword": "string (deve coincidir)",
    "cpf": "string (11 dígitos)",
    "roles": ["ROLE_OPERATOR"]
  },
  "address": {
    "street": "string (obrigatório)",
    "number": "string (obrigatório)",
    "complement": "string (opcional)",
    "neighborhood": "string (obrigatório)",
    "city": "string (obrigatório)",
    "state": "string (2 caracteres, ex: SP)",
    "postalCode": "string (8 dígitos)",
    "country": "string (padrão: Brasil)"
  },
  "phones": [
    {
      "number": "string (10-11 dígitos)",
      "type": "MOBILE|LANDLINE|WHATSAPP"
    }
  ]
}
```

#### Refresh Token
- **Endpoint**: `POST /api/auth/refresh`
- **Headers**: `Authorization: Bearer {refreshToken}`

### 1.2 Gerenciamento de Usuários

#### Obter Perfil do Usuário Logado
- **Endpoint**: `GET /users/me`
- **Headers**: `Authorization: Bearer {accessToken}`

#### Criar Novo Usuário (Admin)
- **Endpoint**: `POST /users`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Payload**: Similar ao registro, mas sem dados de fazenda

## 2. GESTÃO DE FAZENDAS

### 2.1 Endpoints de Fazenda

#### Listar Fazendas
- **Endpoint**: `GET /farms`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Query Params**: `page`, `size`, `sort`

#### Obter Fazenda por ID
- **Endpoint**: `GET /farms/{id}`
- **Headers**: `Authorization: Bearer {accessToken}`

#### Atualizar Fazenda
- **Endpoint**: `PUT /farms/{id}`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Payload**: Dados da fazenda para atualização

## 3. GESTÃO DE CABRAS

### 3.1 Endpoints de Cabras

#### Listar Cabras
- **Endpoint**: `GET /goats`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Query Params**:
  - `page`: número da página
  - `size`: tamanho da página
  - `name`: filtro por nome
  - `registrationNumber`: filtro por número de registro

#### Cadastrar Nova Cabra
- **Endpoint**: `POST /goats`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Payload**:
```json
{
  "registrationNumber": "string (10-12 caracteres)",
  "name": "string (3-60 caracteres)",
  "gender": "MALE|FEMALE",
  "breed": "ALPINE|ANGLO_NUBIANA|BOER|MESTIÇA|MURCIANA_GRANADINA|ALPINA|SAANEN|TOGGENBURG",
  "color": "string (obrigatório)",
  "birthDate": "YYYY-MM-DD",
  "status": "ACTIVE|INACTIVE|SOLD|DECEASED",
  "tod": "string (exatamente 5 caracteres)",
  "toe": "string (5-7 caracteres)",
  "userId": "number (ID do usuário proprietário)",
  "category": "REPRODUTOR|MATRIZ|CRIA|RECRIA|DESCARTE",
  "weight": "number (opcional)",
  "observations": "string (opcional)"
}
```

#### Atualizar Cabra
- **Endpoint**: `PUT /goats/{registrationNumber}`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Payload**: Dados da cabra para atualização

#### Obter Cabra por Registro
- **Endpoint**: `GET /goats/{registrationNumber}`
- **Headers**: `Authorization: Bearer {accessToken}`

## 4. GESTÃO DE EVENTOS

### 4.1 Endpoints de Eventos

#### Listar Eventos de uma Cabra
- **Endpoint**: `GET /goats/{registrationNumber}/events`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Query Params**:
  - `eventType`: `COBERTURA|PARTO|MORTE|SAUDE|VACINACAO|TRANSFERENCIA|MUDANCA_PROPRIETARIO|PESAGEM|OUTRO`
  - `startDate`: `YYYY-MM-DD`
  - `endDate`: `YYYY-MM-DD`
  - `page`, `size`

#### Criar Evento
- **Endpoint**: `POST /goats/{registrationNumber}/events`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Payload**:
```json
{
  "eventType": "COBERTURA|PARTO|MORTE|SAUDE|VACINACAO|TRANSFERENCIA|MUDANCA_PROPRIETARIO|PESAGEM|OUTRO",
  "eventDate": "YYYY-MM-DD",
  "description": "string (obrigatório)",
  "observations": "string (opcional)",
  "cost": "number (opcional)",
  "veterinarian": "string (opcional)"
}
```

#### Atualizar Evento
- **Endpoint**: `PUT /goats/{registrationNumber}/events/{id}`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Payload**: Dados do evento para atualização

## 5. GENEALOGIA

### 5.1 Endpoints de Genealogia

#### Obter Genealogia
- **Endpoint**: `GET /genealogies/{registrationNumber}`
- **Headers**: `Authorization: Bearer {accessToken}`

#### Criar Genealogia
- **Endpoint**: `POST /genealogies/{registrationNumber}`
- **Headers**: `Authorization: Bearer {accessToken}`

## 6. GESTÃO DE ENDEREÇOS

### 6.1 Endpoints de Endereços

#### Criar Endereço
- **Endpoint**: `POST /address`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Payload**:
```json
{
  "street": "string (obrigatório)",
  "number": "string (obrigatório)",
  "complement": "string (opcional)",
  "neighborhood": "string (obrigatório)",
  "city": "string (obrigatório)",
  "state": "string (2 caracteres)",
  "postalCode": "string (8 dígitos)",
  "country": "string (padrão: Brasil)"
}
```

## 7. ESTRUTURA DO FRONTEND

### 7.1 Páginas Principais

#### 7.1.1 Página de Login
- Formulário com email e senha
- Validação de campos obrigatórios
- Tratamento de erros de autenticação
- Redirecionamento após login bem-sucedido
- Link para registro de nova fazenda

#### 7.1.2 Página de Registro de Fazenda
- Formulário multi-step:
  1. Dados da fazenda
  2. Dados do usuário proprietário
  3. Endereço da fazenda
  4. Telefones de contato
- Validações em tempo real
- Confirmação de senha
- Validação de CPF e CNPJ
- Validação de CEP

#### 7.1.3 Dashboard Principal
- Resumo estatístico:
  - Total de cabras
  - Cabras por status
  - Eventos recentes
  - Alertas importantes
- Gráficos e métricas
- Acesso rápido às funcionalidades

#### 7.1.4 Gestão de Cabras
- **Lista de Cabras**:
  - Tabela paginada
  - Filtros por nome e número de registro
  - Ordenação por colunas
  - Ações: visualizar, editar, excluir
  - Botão para cadastrar nova cabra

- **Cadastro/Edição de Cabra**:
  - Formulário com todos os campos obrigatórios
  - Seletores para enums (raça, gênero, status, categoria)
  - Validação de TOD (5 caracteres) e TOE (5-7 caracteres)
  - Upload de foto (opcional)
  - Campo de observações

- **Detalhes da Cabra**:
  - Informações completas
  - Histórico de eventos
  - Genealogia (se disponível)
  - Botões para editar e adicionar eventos

#### 7.1.5 Gestão de Eventos
- **Lista de Eventos**:
  - Filtros por tipo, data e cabra
  - Visualização em calendário ou lista
  - Cores diferentes por tipo de evento

- **Cadastro/Edição de Evento**:
  - Seleção da cabra
  - Tipo de evento (dropdown)
  - Data do evento
  - Descrição obrigatória
  - Campos opcionais (custo, veterinário, observações)

#### 7.1.6 Genealogia
- Visualização em árvore genealógica
- Navegação interativa
- Informações de pais e filhos
- Botão para criar genealogia se não existir

#### 7.1.7 Configurações
- **Perfil do Usuário**:
  - Visualização e edição de dados pessoais
  - Alteração de senha
  - Configurações de notificação

- **Gestão da Fazenda**:
  - Dados da fazenda
  - Endereço
  - Telefones
  - Usuários da fazenda (se admin)

### 7.2 Componentes Reutilizáveis

#### 7.2.1 Componentes de Formulário
- Input com validação
- Select com opções de enum
- DatePicker
- TextArea
- FileUpload
- FormGroup com label e erro

#### 7.2.2 Componentes de Interface
- Header com navegação
- Sidebar com menu
- Breadcrumb
- Modal para confirmações
- Toast para notificações
- Loading spinner
- Pagination
- DataTable

#### 7.2.3 Componentes de Negócio
- GoatCard (card resumido da cabra)
- EventTimeline (linha do tempo de eventos)
- GenealogyTree (árvore genealógica)
- StatCard (card de estatística)
- FilterPanel (painel de filtros)

### 7.3 Gerenciamento de Estado

#### 7.3.1 Estado Global (Context/Redux)
- **AuthState**:
  - usuário logado
  - tokens de acesso
  - permissões
  - status de autenticação

- **FarmState**:
  - dados da fazenda atual
  - configurações

- **GoatsState**:
  - lista de cabras
  - filtros aplicados
  - cabra selecionada

- **EventsState**:
  - eventos carregados
  - filtros de eventos

#### 7.3.2 Estado Local
- Estados de formulários
- Estados de loading
- Estados de erro
- Estados de modais

### 7.4 Serviços e API

#### 7.4.1 Serviço de Autenticação
```javascript
class AuthService {
  async login(email, password)
  async register(farmData)
  async refreshToken()
  async logout()
  getToken()
  isAuthenticated()
  getUserRoles()
}
```

#### 7.4.2 Serviço de API
```javascript
class ApiService {
  constructor(baseURL, authService)
  async get(endpoint, params)
  async post(endpoint, data)
  async put(endpoint, data)
  async delete(endpoint)
  setAuthHeader(token)
}
```

#### 7.4.3 Serviços Específicos
- GoatService
- EventService
- FarmService
- GenealogyService
- AddressService

### 7.5 Validações

#### 7.5.1 Validações de Formulário
- Email formato válido
- Senha mínimo 6 caracteres
- CPF 11 dígitos numéricos
- CNPJ 14 dígitos numéricos
- CEP 8 dígitos numéricos
- TOD exatamente 5 caracteres
- TOE entre 5-7 caracteres
- Campos obrigatórios
- Confirmação de senha

#### 7.5.2 Validações de Negócio
- Número de registro único
- Data de nascimento não futura
- Eventos não anteriores ao nascimento
- Permissões de usuário

### 7.6 Tratamento de Erros

#### 7.6.1 Tipos de Erro
- Erros de validação (400)
- Erros de autenticação (401)
- Erros de autorização (403)
- Erros de não encontrado (404)
- Erros de servidor (500)

#### 7.6.2 Exibição de Erros
- Toast para erros gerais
- Mensagens inline em formulários
- Modal para erros críticos
- Página de erro para falhas graves

### 7.7 Responsividade

#### 7.7.1 Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

#### 7.7.2 Adaptações
- Menu lateral colapsável
- Tabelas com scroll horizontal
- Formulários em coluna única no mobile
- Modais full-screen no mobile

### 7.8 Performance

#### 7.8.1 Otimizações
- Lazy loading de componentes
- Paginação de listas
- Cache de dados frequentes
- Debounce em filtros
- Compressão de imagens

#### 7.8.2 Loading States
- Skeleton screens
- Progress bars
- Spinners
- Placeholders

### 7.9 Segurança

#### 7.9.1 Autenticação
- Tokens JWT seguros
- Refresh automático
- Logout automático por inatividade
- Proteção de rotas

#### 7.9.2 Autorização
- Verificação de roles
- Ocultação de funcionalidades
- Validação no frontend e backend

### 7.10 Testes

#### 7.10.1 Tipos de Teste
- Testes unitários de componentes
- Testes de integração de serviços
- Testes end-to-end de fluxos
- Testes de acessibilidade

#### 7.10.2 Ferramentas
- Jest para testes unitários
- React Testing Library
- Cypress para E2E
- Axe para acessibilidade

## 8. TECNOLOGIAS RECOMENDADAS

### 8.1 Framework Principal
- React 18+ ou Vue 3+
- TypeScript para tipagem

### 8.2 Roteamento
- React Router ou Vue Router
- Proteção de rotas

### 8.3 Estado Global
- Context API + useReducer
- Redux Toolkit
- Zustand
- Pinia (Vue)

### 8.4 UI/Styling
- Material-UI ou Ant Design
- Tailwind CSS
- Styled Components
- CSS Modules

### 8.5 Formulários
- React Hook Form
- Formik
- VeeValidate (Vue)

### 8.6 HTTP Client
- Axios
- Fetch API
- React Query/TanStack Query

### 8.7 Build Tools
- Vite
- Create React App
- Next.js
- Nuxt.js (Vue)

## 9. FLUXOS PRINCIPAIS

### 9.1 Fluxo de Registro
1. Usuário acessa página de registro
2. Preenche dados da fazenda
3. Preenche dados pessoais
4. Preenche endereço
5. Adiciona telefones
6. Submete formulário
7. Recebe confirmação
8. É redirecionado para login

### 9.2 Fluxo de Login
1. Usuário insere credenciais
2. Sistema valida no backend
3. Recebe tokens JWT
4. Armazena tokens seguros
5. Redireciona para dashboard

### 9.3 Fluxo de Cadastro de Cabra
1. Usuário acessa lista de cabras
2. Clica em "Nova Cabra"
3. Preenche formulário
4. Valida dados obrigatórios
5. Submete para API
6. Recebe confirmação
7. Retorna para lista atualizada

### 9.4 Fluxo de Evento
1. Usuário seleciona cabra
2. Acessa histórico de eventos
3. Clica em "Novo Evento"
4. Seleciona tipo de evento
5. Preenche detalhes
6. Salva evento
7. Atualiza timeline

## 10. CONSIDERAÇÕES FINAIS

### 10.1 Acessibilidade
- Suporte a leitores de tela
- Navegação por teclado
- Contraste adequado
- Labels descritivos

### 10.2 Internacionalização
- Preparação para múltiplos idiomas
- Formatação de datas/números
- Mensagens de erro traduzíveis

### 10.3 PWA (Opcional)
- Service Workers
- Cache offline
- Instalação no dispositivo
- Notificações push

### 10.4 Monitoramento
- Analytics de uso
- Tracking de erros
- Performance monitoring
- User feedback

Este documento fornece uma base sólida para o desenvolvimento do frontend que se integra perfeitamente com o backend GoatFarm existente. Cada seção deve ser implementada seguindo as melhores práticas de desenvolvimento web moderno.