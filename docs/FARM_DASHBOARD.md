# Dashboard da Fazenda

## Escopo atual

A dashboard da fazenda continua usando a rota existente `/app/goatfarms/:farmId/dashboard` e o componente existente `FarmDashboardPage`.

Ela foi evoluída para entregar uma visão mais gerencial sem criar uma segunda dashboard paralela.

Também foi alinhada com os fluxos operacionais já existentes no backend para que a experiência do núcleo animal fique coerente com status e ciclo de vida (parto, desmame e saída controlada).

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

## Fluxos operacionais expostos no frontend (núcleo animal)

Sem criar rotas paralelas desnecessárias, o frontend passou a consumir e exibir:

- registro de parto com uma ou mais crias no fluxo de reprodução;
- registro de desmame no fluxo de reprodução;
- saída controlada do rebanho no detalhe do animal.

Contratos consumidos:

- `POST /goatfarms/{farmId}/goats/{goatId}/reproduction/pregnancies/{pregnancyId}/births`
- `POST /goatfarms/{farmId}/goats/{goatId}/reproduction/weaning`
- `PATCH /goatfarms/{farmId}/goats/{goatId}/exit`

Regras refletidas na UI:

- operações de escrita ficam bloqueadas visualmente quando o animal não está ativo;
- status e informação de saída passam a aparecer no card/listagem e no detalhe;
- leitura e navegação continuam disponíveis para histórico e consulta.
