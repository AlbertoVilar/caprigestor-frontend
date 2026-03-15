# Genealogia complementar via ABCC (Frontend)

## Objetivo
Complementar a árvore genealógica de um animal local com dados públicos da ABCC em modo somente leitura.

## Princípios da feature
- Não cria novos animais no CapriGestor.
- Não persiste ancestrais externos.
- Não altera o fluxo de importação patrimonial ABCC.
- A consulta segue pública, no mesmo contexto da genealogia do animal.

## Entrada de UI
- Tela do animal (`Dashboard`): ação `Abrir genealogia completa`.
- Nova página dedicada:
  - `/app/goatfarms/{farmId}/goats/{goatId}/genealogy`
  - ações de `Dados locais`, `Complementar com ABCC`, `Imprimir` e `Salvar em PDF`.

## Contratos consumidos
- Genealogia local:
  - `GET /goatfarms/{farmId}/goats/{goatId}/genealogies`
- Genealogia complementar ABCC:
  - `GET /goatfarms/{farmId}/goats/{goatId}/genealogies?complementaryAbcc=true`

## Comportamento visual
- A árvore mantém o mesmo componente ReactFlow, agora em página dedicada para leitura completa.
- Cada nó exibe origem:
  - `LOCAL`
  - `ABCC`
  - `AUSENTE`
- A tela mostra mensagem de integração retornada pelo backend.
- Aviso permanente:
  - dados ABCC são apenas referência externa, sem incorporação automática ao rebanho.
- O dashboard deixa de renderizar a árvore inline para evitar poluição visual.
- Exportação:
  - impressão via navegador;
  - PDF via `html2pdf.js`.

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
- `src/Pages/genealogy/GoatGenealogyViewPage.tsx`
- `src/Pages/genealogy/goatGenealogyViewPage.css`
- `src/utils/appRoutes.ts`
- `src/main.tsx`

## Resumo oficial da entrega
- Feature pública preservada para consulta genealógica.
- Fluxo somente leitura (`read-only`) com árvore híbrida local + ABCC.
- Sem persistência de ancestrais externos no backend.
- Sem criação de novo animal no rebanho local.
- Separada da importação patrimonial ABCC.
- Lookup principal por `registrationNumber`, sem heurística fraca por nome.
