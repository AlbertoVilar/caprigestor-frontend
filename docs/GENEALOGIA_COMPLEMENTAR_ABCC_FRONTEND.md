# Genealogia complementar via ABCC (Frontend)

## Objetivo
Complementar a árvore genealógica de um animal local com dados públicos da ABCC em modo somente leitura.

## Princípios da feature
- Não cria novos animais no CapriGestor.
- Não persiste ancestrais externos.
- Não altera o fluxo de importação patrimonial ABCC.
- A consulta segue pública, no mesmo contexto da genealogia do animal.

## Entrada de UI
- Tela do animal (`Dashboard`): ação adicional `Complementar com ABCC`.
- Ação original `Ver genealogia` permanece para consulta local.

## Contratos consumidos
- Genealogia local:
  - `GET /goatfarms/{farmId}/goats/{goatId}/genealogies`
- Genealogia complementar ABCC:
  - `GET /goatfarms/{farmId}/goats/{goatId}/genealogies?complementaryAbcc=true`

## Comportamento visual
- A árvore mantém o mesmo componente ReactFlow.
- Cada nó exibe origem:
  - `LOCAL`
  - `ABCC`
  - `AUSENTE`
- A tela mostra mensagem de integração retornada pelo backend.
- Aviso permanente:
  - dados ABCC são apenas referência externa, sem incorporação automática ao rebanho.

## Estados de integração
- `FOUND`
- `NOT_FOUND`
- `UNAVAILABLE`
- `INSUFFICIENT_DATA`

## Arquivos da feature
- `src/api/GenealogyAPI/genealogy.ts`
- `src/Models/goatGenealogyDTO.ts`
- `src/Convertes/genealogies/normalizeGenealogyResponse.ts`
- `src/Convertes/genealogies/convertGenealogyDTOToReactFlowData.ts`
- `src/Components/goat-genealogy/GoatGenealogyTree.tsx`
- `src/Components/goat-genealogy/goatGenealogyTree.css`
- `src/Components/dash-animal-info/GoatActionPanel.tsx`
- `src/Pages/dashboard/Dashboard.tsx`
