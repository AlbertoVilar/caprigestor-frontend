# Alert Center - Contrato Frontend/Backend

## Objetivo
Este documento descreve o contrato usado pelo frontend do Alert Center para evitar divergencias de payload e manter a integracao sem N+1.

## Endpoints consumidos

### 1) Diagnostico de prenhez
- Metodo: `GET`
- Rota: `/api/goatfarms/{farmId}/reproduction/alerts/pregnancy-diagnosis`
- Query:
  - `referenceDate` (opcional)
  - `page` (default frontend: `0`)
  - `size` (default frontend: `20`, resumo usa `1`)
- Campos esperados:
  - `totalPending`
  - `alerts[]`

### 2) Secagem (lactacao)
- Metodo: `GET`
- Rota: `/api/goatfarms/{farmId}/milk/alerts/dry-off`
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
- Rota: `/api/goatfarms/{farmId}/health-events/alerts`
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
