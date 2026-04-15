# CapriGestor Frontend

Frontend do ecossistema CapriGestor. A aplicação entrega a camada web de operação da fazenda, com autenticação por JWT, navegação protegida, módulos de saúde, leite, reprodução, inventário, blog e dashboards operacionais integrados ao backend.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev)

[Backend](https://github.com/albertovilar/caprigestor-backend) • [Arquitetura Frontend](./Doc/ARQUITETURA_FRONTEND.md) • [Guia de UX](./docs/UX_GUIDELINES.md) • [Contrato de Alertas](./docs/ALERTS_CONTRACT.md)

## Visão Geral

O CapriGestor Frontend foi construído para operar um domínio agro real, não apenas um painel administrativo genérico. A aplicação cobre cadastro e operação da fazenda, fluxo dos animais, genealogia, produção leiteira, reprodução, saúde veterinária, inventário, artigos e permissões por fazenda.

Pontos fortes do projeto:

- interface SPA com React 19 e TypeScript;
- integração com backend Spring Boot via APIs versionadas;
- autenticação JWT com rotas protegidas e guards por papel/permissão;
- módulos operacionais conectados ao domínio do backend;
- alert center plugável para saúde, reprodução e secagem;
- testes unitários, integração de frontend e E2E com Playwright;
- pipeline de qualidade com lint, coverage, build e E2E.

## Principais Capacidades

### Gestão da fazenda e animais

- cadastro, edição e visualização de fazendas;
- listagem de caprinos com filtros e contexto operacional;
- criação e edição de animais;
- importação ABCC;
- dashboard do animal com ações por módulo.

### Genealogia, produção e reprodução

- árvore genealógica visual;
- lactação, produção leiteira e sumários;
- fluxo reprodutivo com coberturas, prenhez, alertas e timeline;
- relatórios operacionais por fazenda.

### Saúde, inventário e alertas

- agenda operacional e eventos de saúde;
- alert center com providers de reprodução, saúde e secagem;
- páginas e fluxos de inventário;
- feedback de permissão por perfil e por fazenda.

### Conteúdo e área pública

- páginas públicas e blog;
- renderização de conteúdo rico;
- artigos administrativos;
- integração com o backend do ecossistema CapriGestor.

## Arquitetura Frontend

O projeto está organizado por domínio e responsabilidade:

- `src/Pages`: páginas e fluxos principais;
- `src/Components`: componentes reutilizáveis e blocos de domínio;
- `src/api`: clientes HTTP por domínio;
- `src/services`: serviços de autenticação, permissões e alertas;
- `src/contexts`: contexto de API, autenticação e alertas;
- `src/routes`: guards e roteamento;
- `src/Models` / `src/types`: contratos de dados;
- `src/utils`: helpers e normalização.

Pontos estruturais relevantes:

- `AlertRegistry` e providers específicos para alertas;
- `PrivateRoute`, `ProtectedRoute` e wrappers RBAC;
- clientes por domínio em `src/api/*`;
- testes espalhados pelos módulos críticos do front.

## Stack Técnica

- React 19
- TypeScript 5
- Vite 6
- React Router
- Axios
- React Flow
- Recharts
- React Hook Form
- Zod
- Vitest
- Playwright

## Qualidade

O pipeline do projeto executa:

- lint;
- testes unitários e de integração de frontend;
- cobertura;
- build;
- E2E com Playwright.

Scripts principais:

```bash
npm run dev
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

## Como Rodar

### Pré-requisitos

- Node.js 20+
- npm
- backend `caprigestor-backend` disponível localmente

### 1. Clonar o projeto

```bash
git clone https://github.com/AlbertoVilar/caprigestor-frontend.git
cd caprigestor-frontend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar ambiente

Crie `.env` na raiz:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_DEV_MODE=true
VITE_ENABLE_DEPRECATED_API_FALLBACK=false
```

### 4. Subir a aplicação

```bash
npm run dev
```

Ambiente local:

- Frontend: `http://localhost:5173`
- Backend esperado: `http://localhost:8080/api/v1`
- Swagger do backend: `http://localhost:8080/swagger-ui/index.html`

## Segurança e Acesso

- login com JWT;
- token utilizado automaticamente pelos clientes HTTP;
- guards de rota para sessões autenticadas;
- suporte a RBAC e checagem de permissão por fazenda;
- feedback visual para acesso negado e páginas protegidas.

## Documentação

O README foi mantido enxuto. O detalhamento do frontend está nestes arquivos:

- [ARQUITETURA_FRONTEND.md](./Doc/ARQUITETURA_FRONTEND.md)
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)
- [UX_GUIDELINES.md](./docs/UX_GUIDELINES.md)
- [ALERTS_CONTRACT.md](./docs/ALERTS_CONTRACT.md)
- [FARM_DASHBOARD.md](./docs/FARM_DASHBOARD.md)
- [INVENTORY_FRONTEND.md](./docs/INVENTORY_FRONTEND.md)

## Backend Relacionado

Este frontend depende do backend do ecossistema:

- [caprigestor-backend](https://github.com/albertovilar/caprigestor-backend)

## Licença

Licença ainda não definida publicamente.

## Contato

José Alberto Vilar Pereira

- Email: `albertovilar1@gmail.com`
- LinkedIn: [Alberto Vilar](https://www.linkedin.com/in/alberto-vilar-316725ab)
- GitHub: [@AlbertoVilar](https://github.com/AlbertoVilar)
