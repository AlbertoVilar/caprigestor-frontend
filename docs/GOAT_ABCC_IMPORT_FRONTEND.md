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
- `POST /goatfarms/{farmId}/goats/imports/abcc/confirm-batch`

Implementação frontend:
- `src/api/GoatAPI/goatAbccImport.ts`

## UX implementada
Fluxo no modal `Importar animal da ABCC`:

1. Busca ABCC
- formulário com filtros mínimos (`raceName`, `affix`) e opcionais
- para usuário comum, o filtro de `TOD` fica restrito ao TOD da fazenda e o backend aplica a validação em profundidade
- para `ROLE_ADMIN`, a UI sinaliza modo administrativo com override de TOD
- paginação com navegação por `Página anterior` e `Próxima página`, usando `currentPage` e `totalPages` retornados pelo backend
- seleção múltipla restrita à página atual:
  - checkbox por item
  - `Selecionar todos desta página`
  - `Limpar seleção`
  - `Importar selecionados`
- resultado em lote com resumo e status por item (`IMPORTED`, `SKIPPED_DUPLICATE`, `ERROR`)
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

4. Confirmação em lote (página atual)
- envia apenas os `externalId` selecionados da página corrente
- o backend processa item a item e não derruba o lote inteiro por duplicidade ou TOD incompatível
- duplicidade por `farmId + registrationNumber` retorna `SKIPPED_DUPLICATE`
- TOD incompatível para usuário comum retorna `SKIPPED_TOD_MISMATCH`
- a UI mostra:
  - total selecionado
  - total importado
  - total ignorado por duplicidade
  - total ignorado por TOD incompatível
  - total com erro
  - detalhe por item

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
- Usuário comum só opera importação ABCC dentro do TOD da fazenda.
- `ROLE_ADMIN` visualiza e opera em modo de override administrativo de TOD.
- Seleção em lote vale somente para a página atual da busca.
