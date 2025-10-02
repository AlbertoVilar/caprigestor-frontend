# CapriGestor — Frontend

Sistema frontend do CapriGestor, uma aplicação para gestão de caprinos (cabras) que consome uma API REST. Este projeto oferece cadastro, visualização e análise de dados de animais, fazendas e eventos, além de uma árvore visual de genealogia, autenticação com roles e uma experiência responsiva.

Status: MVP funcional, em desenvolvimento contínuo. Este projeto utiliza apoio de inteligência artificial (IA) em partes do fluxo de documentação e padronização, e segue evoluindo.

---

## Tecnologias Utilizadas

- React + TypeScript + Vite (HMR)
- React Router DOM (rotas protegidas)
- Axios (integração com API)
- Zustand (gerenciamento de estado)
- React Flow (visualização da genealogia)
- React Toastify (notificações)
- Recharts (gráficos)
- CSS modular/global com responsividade
- Estrutura modular com componentes reutilizáveis

---

## Principais Funcionalidades

- Cadastro, edição e visualização de cabras, fazendas e eventos
- Genealogia visual com árvore de ancestrais (React Flow)
- Dashboard por fazenda com gráficos e métricas (Recharts)
- Controle de acesso com login e roles (`admin`, `operator`)
- Interações amigáveis e responsivas (mobile-first)

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 18+ instalado
- NPM 9+ ou Yarn instalado
- Backend rodando (ver links abaixo)

### Passos

1. Clonar o repositório do frontend
   - `git clone https://github.com/AlbertoVilar/caprigestor-frontend.git`
   - `cd caprigestor-frontend`

2. Instalar dependências
   - NPM: `npm install`
   - Yarn: `yarn`

3. Configurar variáveis de ambiente
   - Crie um arquivo `.env` na raiz com:
     ```env
     VITE_API_BASE_URL=http://localhost:8080/api
     VITE_DEV_MODE=true
     ```

4. Rodar em desenvolvimento (Vite)
   - NPM: `npm run dev`
   - Yarn: `yarn dev`

5. Acessar no navegador
   - `http://localhost:5173/` (porta padrão do Vite; pode variar)

---

## Variáveis de Ambiente

- `VITE_API_BASE_URL`: Base URL da API backend (ex.: `http://localhost:8080/api`)
- `VITE_DEV_MODE`: Habilita comportamentos de desenvolvimento (`true/false`)

---

## Organização do Projeto

- `src/Pages/` — páginas e fluxos
- `src/Components/` — componentes reutilizáveis (UI, forms, listas, etc.)
- `src/api/` — comunicação com backend (Axios, clientes por domínio)
- `src/Models/` — interfaces e DTOs
- `src/services/` — serviços (autenticação, permissões, regras auxiliares)
- `src/contexts/` — contextos (ex.: API, Auth)
- `src/routes/` — definição de rotas e guarded routes
- `src/utils/` — utilitários (validações, config, i18n, request helpers)
- `src/styles/` — estilos globais e modulares

---

## Links Cruzados

- Repositório backend: https://github.com/albertovilar/caprigestor-backend
- Swagger UI da API: `http://localhost:8080/swagger-ui/index.html`

---

## Segurança e Autenticação

- Armazenamento de tokens: `localStorage` (repositório de access token em `src/localstorage/`)
- Interceptadores HTTP: Axios com interceptors para incluir `Authorization: Bearer <token>` e tratar erros
- Roles e controle de acesso: `admin` e `operator`; rotas protegidas via React Router e componentes/guards de permissão

---

## Contato

- Nome: José Alberto Vilar Pereira
- Email: `albertovilar1@gmail.com`
- LinkedIn: `linkedin.com/in/alberto-vilar-316725ab`
- GitHub: `github.com/albertovilar`

---

## Screenshots / Vídeos / GIFs (Opcional)

Este espaço é reservado para imagens, GIFs e vídeos demonstrando o uso das principais funcionalidades (cadastro de cabras, genealogia, dashboard por fazenda, autenticação). Sugestão:

- Diretório: `assets/screenshots/` e `assets/videos/`
- Nomear arquivos com padrão: `feature-contexto-data.ext` (ex.: `genealogia-arvore-2025-10-02.png`)

---

## Notas

- Este projeto faz uso de inteligência artificial (IA) para apoiar documentação, padronização e revisão de conteúdos.
- O desenvolvimento está ativo; novas funcionalidades e melhorias de UX/segurança estão sendo adicionadas.