# Arquitetura Frontend - Capril Vilar React

Este documento descreve a arquitetura da aplicação frontend, suas principais tecnologias, padrões de projeto e estrutura de pastas.

## 1. Visão Geral da Arquitetura

A aplicação é uma **Single Page Application (SPA)** construída com **React 19** e **Vite**. Ela utiliza **TypeScript** para garantir a segurança de tipos e segue uma arquitetura orientada a componentes, com uma clara separação de responsabilidades entre a UI, a lógica de negócios e a comunicação com a API.

- **Framework Principal**: React 19
- **Build Tool**: Vite
- **Linguagem**: TypeScript
- **Roteamento**: React Router v7
- **Comunicação API**: Axios
- **Gerenciamento de Estado**: React Context API (para autenticação) e hooks customizados.
- **Estilização**: CSS Modules e componentes de UI customizados.
- **Notificações**: `react-toastify`

## 2. Estrutura de Pastas (Directory Layout)

A estrutura de pastas é organizada por funcionalidade para promover modularidade e escalabilidade.

```
/src
|
|-- /api/           # Lógica de comunicação com a API (Axios client, endpoints)
|-- /assets/        # Imagens, fontes e outros ativos estáticos
|-- /components/    # Componentes de UI reutilizáveis (botões, inputs, cards)
|-- /contexts/      # Contextos React para gerenciamento de estado global (AuthContext)
|-- /hooks/         # Hooks customizados (ex: useFarms, usePermissions)
|-- /models/        # Interfaces e tipos TypeScript (DTOs) que modelam os dados da API
|-- /pages/         # Componentes que representam páginas completas da aplicação
|-- /routes/        # Configuração do roteamento principal da aplicação
|-- /services/      # Lógica de negócio desacoplada da UI (ex: cálculos, formatação)
|-- /styles/        # Estilos globais e variáveis CSS
|-- /utils/         # Funções utilitárias genéricas
|-- main.tsx        # Ponto de entrada da aplicação
```

## 3. Gerenciamento de Estado (State Management)

O estado é gerenciado principalmente através de:

- **Estado Local do Componente**: `useState` e `useReducer` para estados que não precisam ser compartilhados.
- **React Context API**: Para estado global que é acessado por muitos componentes, como informações de autenticação (`AuthContext`). O `AuthContext` provê dados do usuário logado, seu token e papéis (roles).
- **Hooks Customizados**: Para encapsular e reutilizar lógica de estado complexa, especialmente aquela que interage com a API (ex: `useFarms` para buscar e gerenciar a lista de fazendas).

## 4. Comunicação com a API (API Communication)

A comunicação com o backend é centralizada no diretório `src/api`.

- **Cliente Axios**: Um cliente Axios (`apiClient.ts`) é configurado como uma instância única.
- **Interceptadores**: Um interceptador de requisições é usado para adicionar automaticamente o token JWT (obtido do `AuthContext`) ao cabeçalho `Authorization` de cada chamada para a API.
- **Endpoints**: Cada recurso da API (ex: `GoatFarmAPI`, `GoatAPI`) tem seu próprio arquivo, que exporta funções para realizar as operações CRUD (`fetchGoats`, `createGoat`, etc.).

## 5. Roteamento (Routing)

O roteamento é gerenciado pelo **React Router v7**.

- **`Routes.tsx`**: O arquivo principal de rotas (`src/routes/index.tsx`) define todas as rotas da aplicação.
- **Rotas Protegidas (`PrivateRoute`)**: Um componente de ordem superior (`PrivateRoute`) é usado para proteger rotas que exigem autenticação. Ele verifica o estado de autenticação no `AuthContext` e redireciona para a página de login se o usuário não estiver autenticado.
- **Autorização por Rota**: O `PrivateRoute` também pode receber papéis (roles) permitidos e verificar se o usuário logado possui a permissão necessária para acessar a rota.

## 6. Autenticação e Autorização (Authentication & Authorization)

- **Autenticação**: O fluxo de login obtém um token JWT do backend. Esse token é armazenado no `localStorage` e carregado no `AuthContext` no início da aplicação.
- **Autorização (RBAC)**: A autorização é baseada em papéis (Role-Based Access Control). O token JWT contém os papéis do usuário (ex: `ADMIN`, `OPERATOR`).
  - **Nível de Rota**: O `PrivateRoute` controla o acesso a páginas inteiras.
  - **Nível de Componente**: Componentes individuais (como `GoatActionPanel`) podem renderizar ou ocultar elementos da UI (ex: botões de "Editar", "Excluir") com base nos papéis do usuário, que são obtidos através do `AuthContext`.

## 7. Estilização (Styling)

A estilização é feita de forma modular e consistente.

- **CSS Modules**: A maioria dos componentes usa CSS Modules (`*.module.css`) para escopar os estilos localmente e evitar conflitos de nomes de classes.
- **Variáveis CSS**: Um arquivo de estilos globais (`src/styles/index.css`) define variáveis CSS para cores, fontes e espaçamentos, garantindo consistência visual.
- **Biblioteca de Ícones**: `react-icons` é utilizada para ícones, permitindo fácil acesso a diversas bibliotecas de ícones populares.

## 8. Formulários e Validação (Forms & Validation)

- **Estado do Formulário**: Os formulários são controlados usando o hook `useState` para gerenciar os dados de cada campo.
- **Validação**: A validação é realizada no lado do cliente antes do envio, verificando campos obrigatórios, formatos e outras regras de negócio.
- **Feedback ao Usuário**: `react-toastify` é usado para exibir notificações de sucesso ou erro após o envio de formulários.

## 9. Tipagem e Modelos de Dados (Typing & Data Models)

**TypeScript** é um pilar central da arquitetura.

- **DTOs (Data Transfer Objects)**: O diretório `src/models` contém interfaces TypeScript que definem a estrutura dos dados trocados com a API (ex: `GoatResponseDTO`, `FarmCreateRequestDTO`). Isso garante que os dados sejam consistentes em toda a aplicação.
- **Conversores/Mappers**: O diretório `src/Convertes` contém funções que transformam os dados recebidos da API (DTOs) em um formato mais adequado para a UI (ViewModel) e vice-versa. Isso desacopla o formato de dados do backend do formato de dados do frontend.

## 10. Build e Deploy (Build & Deployment)

- **Vite**: Atua como o servidor de desenvolvimento e a ferramenta de build.
- **Comandos**:
  - `npm run dev`: Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR).
  - `npm run build`: Gera os arquivos estáticos otimizados para produção no diretório `dist/`.
- **Deployment**: O conteúdo da pasta `dist/` pode ser servido por qualquer servidor de arquivos estáticos (ex: Nginx, Vercel, Netlify).

## 11. Testes (Testing)

(Visão geral da estratégia de testes, mesmo que ainda não implementada)

- **Testes Unitários**: Para testar funções puras (utilitários, conversores, hooks customizados) usando uma ferramenta como **Vitest**.
- **Testes de Componentes**: Para testar componentes de UI isoladamente usando **React Testing Library**.
- **Testes End-to-End (E2E)**: Para simular o fluxo completo do usuário na aplicação usando uma ferramenta como **Cypress** ou **Playwright**.
