# Importação opcional de cabra via ABCC (Frontend)

## Objetivo
Adicionar no frontend do módulo Goat um fluxo opcional de importação via ABCC pública, mantendo o cadastro manual existente sem dependência da ABCC.

## Onde o fluxo entra
- Página: `Lista de Cabras`.
- Arquivo principal: `src/Pages/goat-list-page/GoatListPage.tsx`.
- Entrada visual no header:
  - `Cadastrar nova cabra` (fluxo manual atual)
  - `Importar da ABCC` (novo fluxo opcional)

## Contratos consumidos no backend
Todos os requests seguem apenas o backend do CapriGestor (sem chamada direta ao site da ABCC pelo navegador):

- `POST /goatfarms/{farmId}/goats/imports/abcc/search`
- `POST /goatfarms/{farmId}/goats/imports/abcc/preview`
- `POST /goatfarms/{farmId}/goats/imports/abcc/confirm`

Implementação frontend:
- `src/api/GoatAPI/goatAbccImport.ts`

## UX implementada
Fluxo no modal `Importar animal da ABCC`:

1. Busca ABCC
- formulário com filtros mínimos (`raceId`, `affix`) e opcionais
- estados tratados:
  - loading
  - vazio
  - erro com retry

2. Pré-visualização
- seleção de item da busca
- carregamento de preview consolidado
- exibição de warnings de normalização quando vierem do backend

3. Confirmação
- revisão dos campos principais antes de confirmar
- envio para endpoint de confirmação
- feedback de sucesso/erro
- recarga da listagem do rebanho após confirmação

## Reaproveitamento aplicado
- Fluxo manual mantido no mesmo ponto de entrada da lista.
- Conversão de payload reutilizada via `mapGoatToBackend`.
- Componentes UI já existentes reutilizados (`Modal`, `Button`, `Alert`, `LoadingState`, `EmptyState`, `ErrorState`).

## O que foi criado
- `src/Components/goat-abcc-import/GoatAbccImportModal.tsx`
- `src/Components/goat-abcc-import/goatAbccImportModal.css`
- `src/api/GoatAPI/goatAbccImport.ts`
- `src/Pages/goat-list-page/GoatListActions.tsx`

## Garantias
- Frontend não integra direto com ABCC.
- Cadastro manual permanece disponível e funcional.
- Fluxo ABCC é opcional e independente.
- Sem alteração de contrato do backend.
