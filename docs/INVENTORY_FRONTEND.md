# Inventory no Frontend

## Rota

- Tela protegida: `/app/goatfarms/:farmId/inventory`
- Endpoint canônico do backend: `POST /api/v1/goatfarms/{farmId}/inventory/movements`
- Base URL esperada no ambiente: `VITE_API_BASE_URL=http://localhost:8080/api/v1`

## Fluxo da movimentação

1. O usuário preenche o formulário da movimentação.
2. O frontend gera uma `Idempotency-Key` antes do envio.
3. O backend responde:
   - `201`: movimentação criada
   - `200`: replay idempotente com a mesma chave
4. A UI exibe `movementId`, `resultingBalance` e a chave utilizada.

## Retry idempotente

- Se ocorrer erro de rede ou timeout sem resposta HTTP, a mesma `Idempotency-Key` fica preservada.
- O botão **Reenviar com a mesma chave** é habilitado para repetir o mesmo payload com segurança.
- Se qualquer campo do payload for alterado após a falha, o frontend gera uma nova chave e invalida o reenvio anterior.
- A última tentativa elegível para retry fica salva temporariamente em `sessionStorage`, permitindo refresh simples da página.

## Tratamento de erros

- `400` e `422`: exibem erros por campo (`fieldName`, `message`) e destacam inputs inválidos.
- `404`: mostra mensagem geral de recurso não encontrado.
- `409`: informa conflito de idempotência e orienta um novo envio com chave nova.

## Como testar manualmente

1. Acesse a tela em uma fazenda válida.
2. Envie uma movimentação válida e confirme o badge `Criado` (`201`).
3. Simule falha de rede antes da resposta e confirme que o botão de reenvio aparece.
4. Clique em **Reenviar com a mesma chave** e valide que a resposta volta como `200` ou `201`, sem duplicidade.
5. Altere qualquer campo após a falha e confirme que o reenvio antigo é invalidado.
