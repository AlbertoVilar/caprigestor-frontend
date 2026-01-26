# ??? CapriGestor ? Frontend

### Interface moderna e responsiva para gest?o completa de caprinos

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

[?? Backend](https://github.com/albertovilar/caprigestor-backend) ? [?? Swagger API](http://localhost:8080/swagger-ui/index.html) ? [?? Demo](http://localhost:5173)

---

## ?? Status do Projeto

> **Em Desenvolvimento** ? MVP funcional com melhorias cont?nuas

---

## ?? ?ndice

- [Sobre](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades-principais)
- [Tecnologias](#tecnologias-utilizadas)
- [Pr?-requisitos](#pr?-requisitos)
- [Instala??o](#instala??o-r?pida)
- [Configura??o](#configura??o)
- [Uso](#como-usar)
- [Seguran?a](#seguran?a-e-autentica??o)
- [Estrutura](#estrutura-do-projeto)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contato](#contato)

---

## ?? Sobre o Projeto

**CapriGestor Frontend** ? a interface web do sistema de gest?o de caprinos, oferecendo uma experi?ncia moderna, responsiva e intuitiva. Desenvolvido com **React 19**, **TypeScript** e **Vite**, integra-se perfeitamente com a [API REST do backend](https://github.com/albertovilar/caprigestor-backend).

### ?? Objetivo

Fornecer uma interface amig?vel e eficiente para criadores de caprinos gerenciarem fazendas, animais, genealogia, lacta??o, produ??o de leite e reprodu??o, com visualiza??es interativas e controle de acesso baseado em roles.

---

## ? Funcionalidades Principais

### ?? Dashboard Interativo
- ? Vis?o geral da fazenda com m?tricas em tempo real
- ? Gr?ficos e estat?sticas (Recharts)
- ? Filtros din?micos por per?odo e categoria

### ?? Gest?o de Animais
- ? Cadastro completo com valida??es
- ? Listagem paginada e filtros avan?ados
- ? Visualiza??o detalhada de cada animal
- ? Busca inteligente por nome/c?digo

### ?? ?rvore Geneal?gica Visual
- ? Visualiza??o interativa com React Flow
- ? Navega??o por gera??es (pais, av?s, bisav?s)
- ? Destaque de linhagens e relacionamentos
- ? Zoom e pan para ?rvores complexas

### ?? Lacta??o
- ? Abertura e encerramento de lacta??o
- ? Lacta??o ativa e hist?rico por animal
- ? Detalhamento por registro

### ?? Produ??o de Leite
- ? Registro di?rio por data e turno
- ? Edi??o e exclus?o de registros
- ? Filtros por per?odo e m?tricas de total/m?dia

### ?? Reprodu??o
- ? Registro de cobertura (natural/IA)
- ? Confirma??o de prenhez e acompanhamento
- ? Hist?rico completo por animal

### ?? Controle de Acesso
- ? Login seguro com JWT
- ? Roles: `ADMIN` e `OPERATOR`
- ? Rotas protegidas
- ? Permiss?es granulares por funcionalidade

### ??? Gest?o de Eventos
- ? Registro de nascimentos, coberturas, pesagens
- ? Hist?rico completo por animal
- ? Notifica??es visuais (React Toastify)

---

## ??? Tecnologias Utilizadas

### Core
- **React 19** ? Biblioteca UI com Hooks
- **TypeScript 5** ? Tipagem est?tica e IntelliSense
- **Vite 6** ? Build tool ultra-r?pido com HMR

### Roteamento e Estado
- **React Router DOM** ? Navega??o com rotas protegidas
- **Zustand** ? Gerenciamento de estado leve e eficiente

### Visualiza??o de Dados
- **React Flow** ? ?rvore geneal?gica interativa
- **Recharts** ? Gr?ficos responsivos e customiz?veis

### Comunica??o
- **Axios** ? Cliente HTTP com interceptors

### UI/UX
- **CSS (arquivos .css)** ? Estilos organizados por classe; sem CSS Modules
- **React Toastify** ? Notifica??es elegantes
- **Mobile-First** ? Design responsivo

---

## ?? Pr?-requisitos

Antes de come?ar, certifique-se de ter:

- ?? **Node.js 18+** instalado
- ?? **npm 9+** ou **yarn** instalado
- ?? **Backend rodando** ([ver instru??es](https://github.com/albertovilar/caprigestor-backend))

---

## ?? Instala??o R?pida

### 1?? Clone o reposit?rio

```bash
git clone https://github.com/AlbertoVilar/caprigestor-frontend.git
cd caprigestor-frontend
```

### 2?? Instale as depend?ncias

```bash
# Com npm
npm install

# Ou com yarn
yarn install
```

### 3?? Configure as vari?veis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_DEV_MODE=true
```

### 4?? Execute em desenvolvimento

```bash
# Com npm
npm run dev

# Ou com yarn
yarn dev
```

### 5?? Acesse no navegador

```
http://localhost:5173
```

---

## ?? Configura??o

### ?? Vari?veis de Ambiente

| Vari?vel | Descri??o | Exemplo |
|----------|-----------|---------|
| `VITE_API_BASE_URL` | URL base da API backend | `http://localhost:8080/api` |
| `VITE_DEV_MODE` | Habilita modo desenvolvedor | `true` ou `false` |

### ??? Build para Produ??o

```bash
# Build otimizado
npm run build

# Preview local do build
npm run preview
```

---

## ?? Como Usar

### ?? Login

1. Acesse `http://localhost:5173/login`
2. Use as credenciais configuradas no backend
3. O sistema redirecionar? para o dashboard

### ?? Dashboard

- Visualize m?tricas gerais da fazenda
- Acesse gr?ficos de animais por categoria
- Navegue rapidamente para outras se??es

### ?? Gerenciar Animais

```
Dashboard ? Animais ? [+ Novo Animal]
```

- Preencha o formul?rio com valida??es em tempo real
- Adicione foto (opcional)
- Vincule genealogia (pai/m?e)

### ?? Visualizar Genealogia

```
Animal ? [Ver Genealogia]
```

- Explore a ?rvore visual interativa
- Clique em n?s para detalhes
- Use zoom para ?rvores grandes

### ?? Lacta??o e ?? Produ??o de Leite

```
Animal ? [Lacta??es] ? [Lacta??o ativa / Produ??o de leite]
```

- Inicie e encerre lacta??es
- Registre produ??o di?ria por turno
- Filtre por per?odo e consulte m?tricas

### ?? Reprodu??o

```
Animal ? [Reprodu??o]
```

- Registre cobertura e confirme prenhez
- Acompanhe gesta??o ativa e hist?rico

---

## ?? Seguran?a e Autentica??o

### ??? Implementa??o

- **Tokens JWT**: Armazenados em `localStorage`
- **Interceptors Axios**: Injetam `Authorization: Bearer <token>` automaticamente
- **Rotas Protegidas**: Guards no React Router
- **Refresh Logic**: Renova??o autom?tica de tokens expirados

### ?? Roles e Permiss?es

| Role | Permiss?es |
|------|-----------|
| **ADMIN** | Acesso total (CRUD em todas as entidades) |
| **OPERATOR** | Leitura completa + CRUD de animais/eventos |

### ?? Boas Pr?ticas

- ? Tokens n?o enviados via query params
- ? Logout limpa `localStorage`
- ? Redirect autom?tico para login em 401
- ? HTTPS obrigat?rio em produ??o (configurar no deploy)

---

## ??? Estrutura do Projeto

```
src/
??? Pages/              # P?ginas (Dashboard, Login, Animals, etc.)
??? Components/         # Componentes reutiliz?veis (UI, Forms, Lists)
??? api/                # Clientes Axios por dom?nio (farms, goats, events)
??? Models/             # Interfaces TypeScript e DTOs
??? services/           # Servi?os (auth, permissions, utils)
??? contexts/           # Contextos React (API, Auth)
??? routes/             # Defini??o de rotas e guards
??? utils/              # Utilit?rios (valida??es, formatters, i18n)
??? styles/             # Estilos globais e modulares
??? localstorage/       # Reposit?rio de tokens e cache
```

---

<!-- Se??o Mermaid removida conforme solicita??o: frontend sem diagrama aqui. -->

## ?? Screenshots

> ?? **Em breve**: Capturas de tela do Dashboard, Genealogia, Lacta??o e Reprodu??o

<!-- Espa?o reservado para imagens -->
<!-- ![Dashboard](./assets/screenshots/dashboard.png) -->
<!-- ![Genealogia](./assets/screenshots/genealogy-tree.png) -->

---

## ??? Roadmap

### Vers?o 1.1 (Pr?ximas 2 semanas)
- [ ] Testes E2E com Playwright
- [ ] Melhorias de acessibilidade (ARIA, navega??o por teclado)
- [ ] Cache offline com Service Worker

### Vers?o 1.2 (Pr?ximo m?s)
- [ ] Internacionaliza??o (pt-BR, en-US, es-ES)
- [ ] Dark mode
- [ ] Dashboard com m?tricas avan?adas

### Vers?o 2.0 (Futuro)
- [ ] PWA completo (instal?vel)
- [ ] Notifica??es push
- [ ] Exporta??o de relat?rios (PDF, Excel)

---

<!-- Se??o de contribui??es removida conforme solicita??o do autor. -->

## ?? Links Relacionados

- ?? [Backend (API REST)](https://github.com/albertovilar/caprigestor-backend)
- ?? [Swagger/OpenAPI](http://localhost:8080/swagger-ui/index.html)
- ?? [Documenta??o T?cnica Backend](https://github.com/albertovilar/caprigestor-backend/blob/main/DOCUMENTACAO_BACKEND.md)

---

## ?? Licen?a

Em processo de defini??o. A licen?a oficial ser? publicada em breve.

---

## ?? Contato

**Jos? Alberto Vilar Pereira**

- ?? Email: [albertovilar1@gmail.com](mailto:albertovilar1@gmail.com)
- ?? LinkedIn: [alberto-vilar-316725ab](https://www.linkedin.com/in/alberto-vilar-316725ab)
- ?? GitHub: [@albertovilar](https://github.com/albertovilar)

---

## ?? Changelog

### [1.0.0] - 2025-02-10
- ? MVP funcional com todas as funcionalidades principais
- ?? Interface responsiva e moderna
- ?? Autentica??o JWT completa
- ?? ?rvore geneal?gica interativa
- ?? Dashboard com gr?ficos (Recharts)

### [0.9.0] - 2025-01-15
- ?? Primeira vers?o com funcionalidades b?sicas

---

**Desenvolvido com ? e ?? por [Alberto Vilar](https://github.com/albertovilar)**

? Se este projeto foi ?til para voc?, considere dar uma estrela!

[?? GitHub](https://github.com/albertovilar) ? [?? LinkedIn](https://www.linkedin.com/in/alberto-vilar-316725ab) ? [?? Email](mailto:albertovilar1@gmail.com)
