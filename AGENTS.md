# Instruções permanentes — frontend CAPRIGESTOR

## Fonte oficial de estado

Antes de iniciar qualquer tarefa, leia obrigatoriamente o documento canônico do
produto em `..\backend\docs\00-overview\CAPRIGESTOR_CURRENT_STATE.md`.

O frontend e o backend fazem parte do mesmo produto. Nunca crie uma segunda cópia
completa de `CAPRIGESTOR_CURRENT_STATE.md` neste repositório ou em outro local.

## Responsabilidades deste repositório

- Respeitar os contratos da API, as decisões globais e o modelo de autorização
  registrados no estado canônico.
- Manter a aplicação React, navegação, acessibilidade, integração HTTP, testes,
  build e configuração de entrega do frontend.
- Ao terminar toda tarefa, atualizar o documento canônico no backend nas seções
  `frontend`, `integrações com API`, `testes`, `build`, `deploy`, `riscos` e
  `próximo passo`, sempre com fatos verificáveis.
- Não reabrir decisões fechadas sem solicitação explícita ou bloqueio técnico
  demonstrável e não expor credenciais, tokens ou dados pessoais.

## Se o documento canônico estiver inacessível

- Não crie fonte concorrente de estado.
- Informe o bloqueio, audite o frontend e seus contratos locais e atualize o
  documento canônico assim que o backend voltar a estar acessível.
- Não faça commit, push, merge, bypass de proteção ou mudança de infraestrutura sem
  autorização explícita da pessoa usuária.
