# Documentação Técnica - Sistema Capril Vilar

## Visão Geral

O **Capril Vilar** é um sistema de gestão de fazendas de cabras desenvolvido em React com TypeScript. O sistema permite o gerenciamento completo de fazendas, cabras, eventos e genealogias, com controle de permissões baseado em propriedade.

## Arquitetura do Sistema

### Stack Tecnológica
- **Frontend**: React 18 + TypeScript + Vite
- **Roteamento**: React Router DOM
- **Estilização**: CSS Modules
- **Autenticação**: JWT Token
- **Gerenciamento de Estado**: Context API
- **Build Tool**: Vite
- **Linting**: ESLint

### Estrutura de Diretórios

```
src/
├── Components/          # Componentes reutilizáveis
│   ├── GoatCard-to-list/       # Cards de cabras
│   ├── goat-card-list/         # Lista de cards
│   ├── goatfarms-cards/        # Cards de fazendas
│   ├── auth/                   # Componentes de autenticação
│   ├── rbac/                   # Controle de acesso
│   └── ...
├── Pages/               # Páginas da aplicação
│   ├── dashboard/              # Dashboard de cabras
│   ├── goat-list-page/         # Listagem de cabras
│   ├── goatfarms/              # Listagem de fazendas
│   └── ...
├── Models/              # Interfaces TypeScript
├── api/                 # Serviços de API
├── contexts/            # Contextos React
├── utils/               # Utilitários
└── routes/              # Configuração de rotas
```

## Componentes Principais

### 1. Sistema de Autenticação

**Arquivos**: `contexts/AuthContext.tsx`, `services/auth-service.ts`

- Gerencia login/logout de usuários
- Armazena token JWT no localStorage
- Fornece contexto de autenticação para toda aplicação
- Controla acesso a rotas protegidas

### 2. Gestão de Fazendas

**Componentes**: `GoatfarmCard.tsx`, `GoatFarmList.tsx`, `FarmEditForm.tsx`

- Listagem de fazendas do usuário
- Criação e edição de fazendas
- **Novidade**: Suporte a Logomarca (`logoUrl`) com visualização nos cards.
- **Novidade**: Gerenciamento avançado de telefones com deduplicação e deleção definitiva via API (`DELETE /api/goatfarms/{id}/phones/{phoneId}`).
- Controle de propriedade baseado em `ownerId`

### 3. Gestão de Cabras

**Componentes**: `GoatCard.tsx`, `GoatCardList.tsx`, `Dashboard.tsx`, `GoatActionPanel.tsx`

- Listagem de cabras por fazenda
- Visualização detalhada de cabras (Dashboard)
- **Dashboard Inteligente**:
  - Busca local de animais integrada.
  - Adaptação de interface baseada em gênero (ex: botões de Lactação/Reprodução ocultos para machos).
- Sistema de permissões baseado em `farmOwnerId`
- Ações: editar, visualizar genealogia, registrar eventos

### 4. Interface e UX

- **Padronização**: Ajustes de contraste em Modais e Inputs para acessibilidade.
- **Home**: Layout responsivo para cards de artigos (Blog).

### 5. Sistema de Blog e Conteúdo

**Componentes**: `BlogListPage.tsx`, `AdminArticleListPage.tsx`, `MarkdownRenderer.tsx`

- **Área Pública**:
  - Listagem de artigos com paginação e busca (título/conteúdo).
  - Filtragem por categorias (Manejo, Saúde, Nutrição, etc.).
  - Visualização de artigos renderizados via Markdown.
- **Área Administrativa**:
  - Gestão completa de artigos (CRUD).
  - Controle de status (Rascunho/Publicado) e Destaques.
  - Editor de texto rico para criação de conteúdo.

### 6. Gestão de Produção e Reprodução

**Componentes**: `LactationManager.tsx`, `LactationSummaryPage.tsx`, `ReproductionPage.tsx`

- **Lactação e Produção**:
  - Controle de início e fim de lactação (secagem).
  - **Sumário de Lactação**: Cálculo automático de dias em lactação (DEL) e volume total produzido.
  - Registro diário de produção de leite.
- **Reprodução**:
  - Ciclo reprodutivo completo: Cobertura -> Prenhez -> Parto.
  - Validações cruzadas (ex: impedir cobertura se animal já está gestante).
  - Histórico reprodutivo integrado ao Dashboard.

### 7. Sistema de Permissões

**Componente**: `rbac/PermissionChecker.tsx`

```typescript
interface PermissionCheckerProps {
  resourceOwnerId?: number;
  children: React.ReactNode;
}
```

- Verifica se usuário logado tem permissão sobre recurso
- Compara `currentUser.id` com `resourceOwnerId`
- Renderiza conteúdo apenas se usuário tem permissão

## Fluxo de Dados e Permissões

### Problema Identificado e Solução

**Problema**: A API não retorna `ownerId` para cabras, causando falha nas verificações de permissão.

**Solução Implementada**:
1. Usar `farmOwnerId` (disponível) em vez de `goat.ownerId` (indisponível)
2. Propagar `farmOwnerId` através da hierarquia de componentes
3. Atualizar verificações de permissão para usar `farmOwnerId`

### Fluxo de Permissões Corrigido

```
GoatListPage (farmData.ownerId)
    ↓ farmOwnerId prop
GoatCardList (recebe farmOwnerId)
    ↓ farmOwnerId prop
GoatCard (usa farmOwnerId para PermissionChecker)
    ↓ navigation state {goat, farmOwnerId}
Dashboard (recebe farmOwnerId via location.state)
    ↓ resourceOwnerId prop
GoatActionPanel (usa farmOwnerId para permissões)
```

## Modelos de Dados (DTOs)

### GoatResponseDTO
```typescript
interface GoatResponseDTO {
  id: number;
  registrationNumber: string;
  name: string;
  breed: string;
  birthDate: string;
  gender: string;
  // Nota: ownerId não é retornado pela API
}
```

### GoatFarmResponseDTO
```typescript
interface GoatFarmResponseDTO {
  id: number;
  name: string;
  ownerId: number;  // Disponível e usado para permissões
  address: AddressRequestDTO;
  owner: OwnerRequestDTO;
}
```

## APIs e Serviços

### Estrutura de APIs
- `GoatAPI/`: Operações CRUD de cabras
- `GoatFarmAPI/`: Operações CRUD de fazendas
- `EventsAPI/`: Gestão de eventos de cabras
- `GenealogyAPI/`: Consulta de genealogias
- `Login/`: Autenticação de usuários

### Configuração de API
**Arquivo**: `utils/apiConfig.ts`
- Configuração base da API
- Interceptors para autenticação
- Tratamento de erros

## Roteamento

### Rotas Principais
- `/` - Home page
- `/login` - Página de login
- `/fazendas` - Lista de fazendas
- `/cabras/:farmId` - Lista de cabras da fazenda
- `/dashboard` - Detalhes da cabra
- `/eventos` - Eventos da cabra

### Proteção de Rotas
**Componente**: `routes/PrivateRoute.tsx`
- Verifica autenticação antes de renderizar rotas protegidas
- Redireciona para login se não autenticado

## Funcionalidades Principais

### 1. Autenticação
- Login com email/senha
- Armazenamento seguro de token JWT
- Logout automático em caso de token expirado

### 2. Gestão de Fazendas
- Criar nova fazenda
- Editar informações da fazenda
- Visualizar cabras da fazenda
- Controle de acesso por proprietário

### 3. Gestão de Cabras
- Visualizar lista de cabras por fazenda
- Acessar detalhes completos da cabra
- Registrar eventos (nascimento, vacinação, etc.)
- Consultar genealogia

### 4. Sistema de Eventos
- Registro de eventos importantes
- Histórico completo por cabra
- Diferentes tipos de eventos

### 5. Genealogia
- Visualização de árvore genealógica
- Relacionamentos pai/mãe
- Histórico reprodutivo

## Segurança e Permissões

### Controle de Acesso
1. **Autenticação**: JWT token obrigatório
2. **Autorização**: Verificação de propriedade de recursos
3. **Validação**: Componente `PermissionChecker` para UI
4. **Proteção**: Rotas protegidas com `PrivateRoute`

### Boas Práticas Implementadas
- Tokens armazenados de forma segura
- Verificação de permissões no frontend e backend
- Logout automático em caso de token inválido
- Validação de propriedade antes de ações sensíveis

## Desenvolvimento e Build

### Scripts Disponíveis
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint ."
}
```

### Configuração de Desenvolvimento
- **Vite**: Servidor de desenvolvimento rápido
- **TypeScript**: Tipagem estática
- **ESLint**: Linting de código
- **Hot Reload**: Atualização automática durante desenvolvimento

## Melhorias Recentes

### Correção de Permissões (Commit: 8b21ff9)
- **Problema**: Botões não apareciam para proprietários devido a `goat.ownerId` undefined
- **Solução**: Implementação de `farmOwnerId` como alternativa
- **Arquivos Modificados**:
  - `GoatCard.tsx`: Adicionado prop `farmOwnerId`
  - `GoatCardList.tsx`: Propagação de `farmOwnerId`
  - `GoatListPage.tsx`: Passagem de `farmData.ownerId`
  - `Dashboard.tsx`: Recebimento via `location.state`
  - `GoatActionPanel.tsx`: Uso de `farmOwnerId` para permissões

## Considerações Técnicas

### Performance
- Componentes otimizados com React.memo quando necessário
- Lazy loading de rotas
- Minimização de re-renders desnecessários

### Manutenibilidade
- Código TypeScript para melhor tipagem
- Componentes modulares e reutilizáveis
- Separação clara de responsabilidades
- Documentação inline quando necessário

### Escalabilidade
- Arquitetura baseada em componentes
- APIs RESTful bem estruturadas
- Sistema de permissões flexível
- Fácil adição de novas funcionalidades

## Próximos Passos Sugeridos

1. **Testes**: Implementar testes unitários e de integração
2. **Cache**: Adicionar cache para melhorar performance
3. **PWA**: Transformar em Progressive Web App
4. **Notificações**: Sistema de notificações em tempo real
5. **Relatórios**: Módulo de relatórios e analytics
6. **Mobile**: Versão mobile responsiva aprimorada

---

**Última Atualização**: Janeiro 2025
**Versão**: 1.0.0
**Desenvolvedor**: Sistema Capril Vilar Team