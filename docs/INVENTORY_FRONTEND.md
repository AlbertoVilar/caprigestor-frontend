# Inventory no Frontend

## Rota e base da API

- Tela protegida: `/app/goatfarms/:farmId/inventory`
- Base URL canônica: `VITE_API_BASE_URL=http://localhost:8080/api/v1`
- Endpoints utilizados:
  - `GET /api/v1/goatfarms/{farmId}/inventory/items?page=&size=`
  - `POST /api/v1/goatfarms/{farmId}/inventory/items`
  - `GET /api/v1/goatfarms/{farmId}/inventory/lots?page=&size=&itemId=&active=`
  - `POST /api/v1/goatfarms/{farmId}/inventory/lots`
  - `PATCH /api/v1/goatfarms/{farmId}/inventory/lots/{lotId}/active`
  - `GET /api/v1/goatfarms/{farmId}/inventory/balances?page=&size=&itemId=&lotId=`
  - `GET /api/v1/goatfarms/{farmId}/inventory/movements?page=&size=&itemId=&lotId=&type=&fromDate=&toDate=`
  - `POST /api/v1/goatfarms/{farmId}/inventory/movements`

## Como usar o fluxo real

1. Clique em **Cadastrar produto** para criar um item de estoque, se ele ainda não existir.
2. Selecione o item pelo nome na lista de itens carregados da fazenda.
3. Se o produto usar lote (`trackLot=true`), selecione um lote real na lista e não um `lotId` digitado manualmente.
4. Se ainda não houver lote, use **Cadastrar lote** ou **Novo lote** dentro da própria tela.
5. Use as abas **Saldos** e **Histórico** para consultar o estado atual antes de movimentar, quando necessário.
6. Preencha a movimentação e envie o comando.

## Itens de estoque

- O modal de cadastro cria o item com `name` e `trackLot`.
- Após criar com sucesso, o item entra na lista local e fica selecionado automaticamente.
- Se o backend responder `409`, o frontend mostra a mensagem de duplicidade no campo `name`.

## Regras de lote no frontend

- Quando o item selecionado tem `trackLot = true`, o campo de lote aparece como **seleção real de lote**.
- O fluxo principal não depende mais de digitar `lotId` manualmente.
- Quando o item selecionado tem `trackLot = false`, o campo de lote é ocultado e o valor anterior é limpo.
- O modal de lote exige produto com controle por lote e valida:
  - `code` obrigatório
  - `description` opcional
  - `expirationDate` opcional
  - `active` obrigatório na criação
- O bloco **Lotes do produto selecionado** permite:
  - visualizar lotes do item
  - ativar lote
  - inativar lote
- O frontend valida o fluxo antes do envio, mas o backend continua sendo a validação final.

## Aba `Saldos`

- Mostra uma tabela paginada com `itemName`, lote exibido por código/descrição, tipo de controle (`trackLot`) e `quantity`.
- Filtros disponíveis:
  - item
  - lote real por seleção
- A consulta usa `GET /inventory/balances` com `activeOnly=true`.

## Aba `Histórico`

- Mostra uma tabela paginada com:
  - `movementDate`
  - `type`
  - `itemName`
  - lote exibido por código/descrição
  - `quantity`
  - `resultingBalance`
- Filtros disponíveis:
  - item
  - tipo
  - lote real por seleção
  - período (`fromDate` e `toDate`)
- Ordenação disponível:
  - mais recentes primeiro
  - mais antigas primeiro
- Se `fromDate > toDate`, o frontend bloqueia a consulta e mostra a mensagem em PT-BR antes de chamar a API.

## Idempotência e retry seguro

- Cada envio de movimentação usa `Idempotency-Key`.
- Se ocorrer erro de rede ou timeout sem resposta HTTP, a mesma chave fica preservada para **Reenviar com a mesma chave**.
- Se qualquer campo do payload mudar depois da falha, o frontend gera uma nova chave e invalida o retry anterior.
- O snapshot de retry fica salvo temporariamente em `sessionStorage`, por fazenda.

## Resposta do backend

- `201`: exibir badge **Criado**
- `200`: exibir badge **Repetido (idempotência)**

O painel de resultado mostra:

- `movementId`
- `type`
- `quantity`
- `itemId`
- `lotId`
- `movementDate`
- `resultingBalance`

## Tratamento de erros

- `400` e `422`: exibem erros por campo (`fieldName`, `message`) e destacam os inputs relevantes.
- `404`: mostra mensagem geral de recurso não encontrado.
- `409`: informa conflito e orienta uma nova tentativa quando necessário.

## Checklist manual rápido

1. Criar um item novo no modal.
2. Se o item usar lote, cadastrar um lote real e confirmar que ele aparece para seleção na movimentação.
3. Inativar e reativar um lote no bloco de gerenciamento.
4. Validar a aba **Saldos** filtrando por item e lote.
5. Validar a aba **Histórico** filtrando por item, tipo e período.
6. Registrar uma movimentação válida e verificar o badge de status.