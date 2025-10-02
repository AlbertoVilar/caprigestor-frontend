# CapriGestor — Frontend

Aplicação frontend do projeto pessoal CapriGestor: um sistema completo de gerenciamento de caprinos (cabras), com funcionalidades de genealogia, controle de eventos (parto, cobertura, vacinação etc.), cadastro de fazendas e animais, além de dashboards por fazenda. Este frontend consome uma API REST do backend CapriGestor.

## 1. Nome do Projeto e Descrição resumida
- Projeto: `CapriGestor — Frontend`
- Descrição: Interface web em `React + TypeScript` responsável pelo cadastro, consulta, visualização e gestão de dados de caprinos, fazendas, genealogias e eventos.

## 2. Tecnologias Utilizadas
- `React` + `TypeScript` + `Vite`
- `React Router DOM`
- `Axios` para consumo de API REST
- `React-Toastify` para feedback ao usuário
- `React-Confirm-Alert` para confirmações
- `React Icons`
- `Recharts` para gráficos
- `React Flow` e/ou `react-d3-tree` para visualizações em árvore (genealogia)
- `Zustand` para gerenciamento de estado leve
- Qualidade de código: `ESLint`, `TypeScript ESLint`

## 3. Principais Funcionalidades
- Cadastro, listagem e edição de fazendas e animais
- Busca e filtros por registro, nome, fazenda e tipo de evento
- Visualização da árvore de genealogia (com zoom, pan e detalhes)
- Gestão de eventos por animal (ex.: parto, cobertura, vacinação), com criação, edição e exclusão
- Dashboard por fazenda com indicadores
- Controle básico de permissões (diretório `src/Components/rbac` e `src/services/PermissionService.ts`)
- Tratamento de erros e feedback ao usuário via toasts

## 4. Como Rodar Localmente (passo a passo)
Pré-requisitos:
- `Node.js` 18+ (recomendado)
- `npm` ou `yarn`
- Backend CapriGestor rodando localmente ou uma URL configurada

Passo a passo:
1. Clone o repositório do frontend
   - `git clone https://github.com/AlbertoVilar/caprigestor-frontend.git`
   - `cd caprigestor-frontend`
2. Crie um arquivo `.env` na raiz do projeto com as variáveis:
   - `VITE_API_BASE_URL=http://localhost:8080/api`
   - `VITE_DEV_MODE=true`
3. Instale as dependências
   - `npm install`  (ou `yarn`)
4. Execute em modo desenvolvimento
   - `npm run dev`
   - Acesse `http://localhost:5173/`
5. Build de produção e preview
   - `npm run build`
   - `npm run preview` (servidor de preview em `http://localhost:4173/`)
6. Lint (opcional)
   - `npm run lint`

Observação: a base URL da API é lida de `VITE_API_BASE_URL`. Em desenvolvimento, se não definida, o cliente HTTP utiliza o padrão `http://localhost:8080/api`.

## 5. Estrutura do Projeto
Principais diretórios e arquivos:
- `src/Components/` — componentes UI (eventos, genealogia, fazendas, navegação etc.)
- `src/Pages/` — páginas e fluxos de navegação
- `src/Models/` — DTOs e modelos TypeScript (ex.: `eventDTO.ts`, `goatResponseDTO.ts`)
- `src/api/` — clientes de API e módulos específicos (ex.: `EventsAPI/event.ts`, `apiClient.ts`)
- `src/services/` — serviços (ex.: `EventService.ts`, `auth-service.ts`, `PermissionService.ts`)
- `src/utils/` — utilitários (ex.: `request.ts`, `apiConfig.ts`, validadores)
- `src/styles/` — estilos globais
- `public/` — assets públicos
- `vite.config.ts` — configuração do Vite
- `package.json` — scripts e dependências

## 6. Segurança e Autenticação
- Autenticação: OAuth2 + JWT provida pelo backend
- Armazenamento de tokens: `localStorage` (`authToken` e `refresh_token`)
- Interceptores HTTP: definidos em `src/utils/request.ts` e `src/api/apiClient.ts`
  - Adição automática de `Authorization: Bearer <token>` em endpoints privados
  - Detecção de endpoints públicos com `auth-service` e `PermissionService`
  - Fluxo de refresh token: em erro `401`, tenta renovar o token e repetir a requisição
  - Tratamento de erros comuns (`403`, `5xx`) com mensagens amigáveis

## 7. Link cruzado entre frontend/backend
- Repositório Backend: `https://github.com/albertovilar/caprigestor-backend`
- Documentação da API: (adicione quando tiver)
- Base URL da API: `http://localhost:8080/api`

## 8. Status do Projeto
- Em desenvolvimento (MVP funcional com módulos de cadastro, genealogia e eventos)

## 9. Autor e contato
- Autor: José Alberto Vilar Pereira
- E-mail: `albertovilar1@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/alberto-vilar-316725ab`
- Site/Portfólio: (adicione quando tiver)

## 10. 📸 Screenshots / GIFs (Reservado)
- Espaço reservado para imagens e GIFs de navegação e funcionalidades

---

Notas técnicas úteis:
- Base URL dinâmica: `VITE_API_BASE_URL` (configurada em `.env`)
- Modo Dev: `VITE_DEV_MODE=true` habilita logs úteis
- Principais clientes HTTP: `src/utils/request.ts` (`requestBackEnd`) e `src/api/apiClient.ts`
- Exemplos de páginas: `src/Pages/goat-events/`, `src/Pages/goat/`, `src/Pages/goatfarms/`