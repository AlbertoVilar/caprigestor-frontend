# Dashboard da Fazenda

## Escopo atual

A dashboard da fazenda continua usando a rota existente `/app/goatfarms/:farmId/dashboard` e o componente existente `FarmDashboardPage`.

Ela foi evoluída para entregar uma visão mais gerencial sem criar uma segunda dashboard paralela.

## Fontes de dados reaproveitadas

- `GET /goatfarms/{farmId}` para contexto da fazenda.
- `GET /goatfarms/{farmId}/goats/summary` para KPIs básicos do rebanho.
- `GET /goatfarms/{farmId}/reproduction/alerts/pregnancy-diagnosis` para alertas de reprodução.
- `GET /goatfarms/{farmId}/milk/alerts/dry-off` para alertas de lactação.
- `GET /goatfarms/{farmId}/health-events/alerts` para resumo sanitário e agenda resumida.
- `GET /goatfarms/{farmId}/inventory/items` para volume de itens cadastrados.
- `GET /goatfarms/{farmId}/inventory/balances` para saldos ativos.
- `GET /goatfarms/{farmId}/inventory/movements` para último movimento e volume do histórico.

## Decisão arquitetural

Nenhum endpoint novo de backend foi criado.

A auditoria mostrou que os dados necessários já existiam em APIs canônicas e estáveis. A evolução foi mantida no frontend para evitar superfície nova desnecessária e preservar a arquitetura do backend.

## Limites conhecidos

- A agenda resumida mostra explicitamente o recorte sanitário disponível hoje. Ela não finge ser uma agenda unificada entre módulos.
- O bloco de estoque usa apenas resumos confiáveis já disponíveis. Não inventa conceito de estoque crítico.
- A navegação continua separando contexto de fazenda e contexto de animal.
