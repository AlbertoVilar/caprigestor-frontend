# Agenda operacional da fazenda

## Estratégia incremental adotada

A agenda da fazenda passou a combinar sinais já existentes de três fontes:

- sanidade: `GET /api/v1/goatfarms/{farmId}/health-events/alerts`
- reprodução: `GET /api/v1/goatfarms/{farmId}/reproduction/alerts/pregnancy-diagnosis`
- lactação: `GET /api/v1/goatfarms/{farmId}/milk/alerts/dry-off`

A implementação permanece `frontend-only` neste estágio porque o backend já expõe os dados necessários para um resumo operacional útil.

## O que a tela entrega agora

- contadores por origem: sanidade, reprodução e lactação
- total consolidado de itens em atenção
- lista resumida com os próximos itens relevantes
- filtro rápido por origem
- CTA para alertas consolidados
- aviso explícito de que a tabela detalhada abaixo continua sanitária

## Limite funcional atual

A agenda ainda não é um calendário unificado completo entre módulos. O detalhamento acionável continua sanitário, enquanto reprodução e lactação entram como resumo operacional com links para suas telas próprias.
