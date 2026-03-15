# Alert Center - Contrato Frontend/Backend

## Objetivo
Este documento descreve o contrato usado pelo frontend do Alert Center para evitar divergencias de payload e manter a integracao sem N+1.

## Endpoints consumidos

### 1) Diagnostico de prenhez
- Metodo: `GET`
- Rota: `/api/v1/goatfarms/{farmId}/reproduction/alerts/pregnancy-diagnosis`
- Query:
  - `referenceDate` (opcional)
  - `page` (default frontend: `0`)
  - `size` (default frontend: `20`, resumo usa `1`)
- Campos esperados:
  - `totalPending`
  - `alerts[]`

### 2) Secagem (lactacao)
- Metodo: `GET`
- Rota: `/api/v1/goatfarms/{farmId}/milk/alerts/dry-off`
- Query:
  - `referenceDate` (opcional)
  - `page` (default frontend: `0`)
  - `size` (resumo: `5`, lista: `20`)
- Campos esperados:
  - `totalPending`
  - `alerts[]` com:
    - `goatId`
    - `startDatePregnancy`
    - `dryOffDate`
    - `gestationDays`
    - `daysOverdue`

### 3) Agenda sanitaria
- Metodo: `GET`
- Rota: `/api/v1/goatfarms/{farmId}/health-events/alerts`
- Query:
  - `windowDays` (default frontend: `7`)
- Campos esperados:
  - `overdueCount`
  - `dueTodayCount`

## Regras de mapeamento no frontend

### Chave de item
- `id = goatId + "-" + dryOffDate`

### Severidade (secagem)
- `daysOverdue > 0` => `high` (OVERDUE)
- `daysOverdue == 0` => `medium` (DUE)
- `daysOverdue < 0` => `low` (UPCOMING)

### Navegacao de detalhe
- Secagem: `/app/goatfarms/{farmId}/alerts?type=lactation_drying`
- Item de secagem (acao): `/app/goatfarms/{farmId}/goats/{goatId}/lactations/active`

## Eventos que disparam refresh

O frontend emite `AlertsEventBus.emit(farmId)` apos sucesso em:
- Confirmacao positiva de prenhez
- Registro de check negativo
- Encerramento de gestacao
- Inicio de lactacao
- Secagem/encerramento de lactacao

O `FarmAlertsContext` escuta o evento e refaz o fetch dos providers.

## Garantia sem N+1

- O Alert Center usa apenas chamadas farm-level para montar resumo e lista paginada.
- Nao existe loop por cabra para montar alertas de secagem.

## V1 - Alertas consolidados da fazenda (frontend-first)

### Fontes consolidadas
- `reproduction_pregnancy_diagnosis`
- `lactation_drying`
- `health_agenda`

### Semantica canonica no frontend
Cada item consolidado de alerta passa a usar:
- `source`: `reproduction | lactation | health`
- `severity`: `high | medium | low`
- `priority`: inteiro para ordenacao cross-source
- `title`
- `description`
- `date`
- `actionLabel`
- `link`

### Regras de priorizacao e severidade
- Reproducao e lactacao usam atraso (`daysOverdue`) para severidade/prioridade.
- Sanidade usa bucket de origem:
  - `overdue` -> `high`
  - `due_today` -> `medium`
  - `upcoming` -> `low`

### Diferenca entre alertas e agenda
- **Alertas**: pendencias priorizadas por severidade e acao.
- **Agenda**: visao temporal operacional.
- A V1 preserva as duas visoes separadas para evitar sobreposicao de responsabilidade.
