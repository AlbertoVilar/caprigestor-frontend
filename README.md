# 🖥️ CapriGestor — Frontend

### Interface moderna e responsiva para gestão completa de caprinos

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

[🔙 Backend](https://github.com/albertovilar/caprigestor-backend) • [📊 Swagger API](http://localhost:8080/swagger-ui/index.html) • [🌐 Demo](http://localhost:5173)


---

## 📊 Status do Projeto

> **Em Desenvolvimento** — MVP funcional com melhorias contínuas

---

## 📑 Índice

- [Sobre](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades-principais)
- [Tecnologias](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação-rápida)
- [Configuração](#configuração)
- [Uso](#como-usar)
- [Segurança](#segurança-e-autenticação)
- [Estrutura](#estrutura-do-projeto)
 - [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contato](#contato)

---

## 📖 Sobre o Projeto

**CapriGestor Frontend** é a interface web do sistema de gestão de caprinos, oferecendo uma experiência moderna, responsiva e intuitiva. Desenvolvido com **React 18**, **TypeScript** e **Vite**, integra-se perfeitamente com a [API REST do backend](https://github.com/albertovilar/caprigestor-backend).

### 🎯 Objetivo

Fornecer uma interface amigável e eficiente para criadores de caprinos gerenciarem fazendas, animais, genealogia e eventos, com visualizações interativas e controle de acesso baseado em roles.

---

## ✨ Funcionalidades Principais

### 🏠 Dashboard Interativo
- ✅ Visão geral da fazenda com métricas em tempo real
- ✅ Gráficos e estatísticas (Recharts)
- ✅ Filtros dinâmicos por período e categoria

### 🐐 Gestão de Animais
- ✅ Cadastro completo com validações
- ✅ Listagem paginada e filtros avançados
- ✅ Visualização detalhada de cada animal
- ✅ Busca inteligente por nome/código

### 🌳 Árvore Genealógica Visual
- ✅ Visualização interativa com React Flow
- ✅ Navegação por gerações (pais, avós, bisavós)
- ✅ Destaque de linhagens e relacionamentos
- ✅ Zoom e pan para árvores complexas

### 🔐 Controle de Acesso
- ✅ Login seguro com JWT
- ✅ Roles: `ADMIN` e `OPERATOR`
- ✅ Rotas protegidas
- ✅ Permissões granulares por funcionalidade

### 📅 Gestão de Eventos
- ✅ Registro de nascimentos, coberturas, pesagens
- ✅ Histórico completo por animal
- ✅ Notificações visuais (React Toastify)

---

## 🛠️ Tecnologias Utilizadas

### Core
- **React 18** — Biblioteca UI com Hooks
- **TypeScript 5** — Tipagem estática e IntelliSense
- **Vite 5** — Build tool ultra-rápido com HMR

### Roteamento e Estado
- **React Router DOM** — Navegação com rotas protegidas
- **Zustand** — Gerenciamento de estado leve e eficiente

### Visualização de Dados
- **React Flow** — Árvore genealógica interativa
- **Recharts** — Gráficos responsivos e customizáveis

### Comunicação
- **Axios** — Cliente HTTP com interceptors

### UI/UX
- **CSS (arquivos .css)** — Estilos organizados por classe; sem CSS Modules
- **React Toastify** — Notificações elegantes
- **Mobile-First** — Design responsivo

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- 🟢 **Node.js 18+** instalado
- 📦 **npm 9+** ou **yarn** instalado
- 🔙 **Backend rodando** ([ver instruções](https://github.com/albertovilar/caprigestor-backend))

---

## 🚀 Instalação Rápida

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/AlbertoVilar/caprigestor-frontend.git
cd caprigestor-frontend
```

### 2️⃣ Instale as dependências

```bash
# Com npm
npm install

# Ou com yarn
yarn install
```

### 3️⃣ Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_DEV_MODE=true
```

### 4️⃣ Execute em desenvolvimento

```bash
# Com npm
npm run dev

# Ou com yarn
yarn dev
```

### 5️⃣ Acesse no navegador

```
http://localhost:5173
```

---

## ⚙️ Configuração

### 🌍 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_BASE_URL` | URL base da API backend | `http://localhost:8080/api` |
| `VITE_DEV_MODE` | Habilita modo desenvolvedor | `true` ou `false` |

### 🏗️ Build para Produção

```bash
# Build otimizado
npm run build

# Preview local do build
npm run preview
```

---

## 💻 Como Usar

### 🔐 Login

1. Acesse `http://localhost:5173/login`
2. Use as credenciais configuradas no backend
3. O sistema redirecionará para o dashboard

### 🏠 Dashboard

- Visualize métricas gerais da fazenda
- Acesse gráficos de animais por categoria
- Navegue rapidamente para outras seções

### 🐐 Gerenciar Animais

```
Dashboard → Animais → [+ Novo Animal]
```

- Preencha o formulário com validações em tempo real
- Adicione foto (opcional)
- Vincule genealogia (pai/mãe)

### 🌳 Visualizar Genealogia

```
Animal → [Ver Genealogia]
```

- Explore a árvore visual interativa
- Clique em nós para detalhes
- Use zoom para árvores grandes

---

## 🔒 Segurança e Autenticação

### 🛡️ Implementação

- **Tokens JWT**: Armazenados em `localStorage`
- **Interceptors Axios**: Injetam `Authorization: Bearer <token>` automaticamente
- **Rotas Protegidas**: Guards no React Router
- **Refresh Logic**: Renovação automática de tokens expirados

### 👥 Roles e Permissões

| Role | Permissões |
|------|-----------|
| **ADMIN** | Acesso total (CRUD em todas as entidades) |
| **OPERATOR** | Leitura completa + CRUD de animais/eventos |

### 🔐 Boas Práticas

- ✅ Tokens não enviados via query params
- ✅ Logout limpa `localStorage`
- ✅ Redirect automático para login em 401
- ✅ HTTPS obrigatório em produção (configurar no deploy)

---

## 🗂️ Estrutura do Projeto

```
src/
├── Pages/              # Páginas (Dashboard, Login, Animals, etc.)
├── Components/         # Componentes reutilizáveis (UI, Forms, Lists)
├── api/               # Clientes Axios por domínio (farms, goats, events)
├── Models/            # Interfaces TypeScript e DTOs
├── services/          # Serviços (auth, permissions, utils)
├── contexts/          # Contextos React (API, Auth)
├── routes/            # Definição de rotas e guards
├── utils/             # Utilitários (validações, formatters, i18n)
├── styles/            # Estilos globais e modulares
└── localstorage/      # Repositório de tokens e cache
```

---

<!-- Seção Mermaid removida conforme solicitação: frontend sem diagrama aqui. -->

## 🎨 Screenshots

> 💡 **Em breve**: Capturas de tela do Dashboard, Genealogia e Cadastro de Animais

<!-- Espaço reservado para imagens -->
<!-- ![Dashboard](./assets/screenshots/dashboard.png) -->
<!-- ![Genealogia](./assets/screenshots/genealogy-tree.png) -->

---

## 🗺️ Roadmap

### Versão 1.1 (Próximas 2 semanas)
- [ ] Testes E2E com Playwright
- [ ] Melhorias de acessibilidade (ARIA, navegação por teclado)
- [ ] Cache offline com Service Worker

### Versão 1.2 (Próximo mês)
- [ ] Internacionalização (pt-BR, en-US, es-ES)
- [ ] Dark mode
- [ ] Dashboard com métricas avançadas

### Versão 2.0 (Futuro)
- [ ] PWA completo (instalável)
- [ ] Notificações push
- [ ] Exportação de relatórios (PDF, Excel)

---

<!-- Seção de contribuições removida conforme solicitação do autor. -->

## 🔗 Links Relacionados

- 🔙 [Backend (API REST)](https://github.com/albertovilar/caprigestor-backend)
- 📚 [Swagger/OpenAPI](http://localhost:8080/swagger-ui/index.html)
- 📖 [Documentação Técnica Backend](https://github.com/albertovilar/caprigestor-backend/blob/main/DOCUMENTACAO_BACKEND.md)

---

## 📄 Licença

Em processo de definição. A licença oficial será publicada em breve.

---

## 👤 Contato

**José Alberto Vilar Pereira**

- 📧 Email: [albertovilar1@gmail.com](mailto:albertovilar1@gmail.com)
- 💼 LinkedIn: [alberto-vilar-316725ab](https://www.linkedin.com/in/alberto-vilar-316725ab)
- 🐙 GitHub: [@albertovilar](https://github.com/albertovilar)

---

## 📝 Changelog

### [1.0.0] - 2025-02-10
- ✨ MVP funcional com todas as funcionalidades principais
- 🎨 Interface responsiva e moderna
- 🔐 Autenticação JWT completa
- 🌳 Árvore genealógica interativa
- 📊 Dashboard com gráficos (Recharts)

### [0.9.0] - 2025-01-15
- 🚀 Primeira versão com funcionalidades básicas

---

**Desenvolvido com ☕ e ❤️ por [Alberto Vilar](https://github.com/albertovilar)**

⭐ Se este projeto foi útil para você, considere dar uma estrela!

[🐙 GitHub](https://github.com/albertovilar) • [💼 LinkedIn](https://www.linkedin.com/in/alberto-vilar-316725ab) • [📧 Email](mailto:albertovilar1@gmail.com)
