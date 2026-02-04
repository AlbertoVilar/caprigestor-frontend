# Guia do Módulo de Saúde (Health)

Este documento descreve o comportamento e as regras de negócio implementadas no frontend para o Módulo de Saúde (Sanidade).

## Regras de Ações por Status

As ações disponíveis para cada evento sanitário dependem do seu status atual e das permissões do usuário:

| Status Atual | Ações Disponíveis | Permissões | Detalhes |
|---|---|---|---|
| **AGENDADO** | **Realizar** | Todos (exceto Public) | Abre modal para informar data de realização e responsável. |
| | **Cancelar** | Todos (exceto Public) | Abre modal para informar motivo do cancelamento. |
| | **Editar** | Todos (exceto Public) | Permite alterar dados do agendamento. |
| **REALIZADO** | **Reabrir** | **Admin, Owner** | Retorna o status para **AGENDADO**. Limpa a data de realização. |
| **CANCELADO** | **Reabrir** | **Admin, Owner** | Retorna o status para **AGENDADO**. |

> **Nota:** Usuários com perfil `ROLE_OPERATOR` **não** visualizam a ação de "Reabrir". Se tentarem forçar a chamada, receberão erro 403.

## Visualização de Cancelados (Agenda)

- O endpoint de calendário (`/health-events/calendar`) **não retorna** eventos com status `CANCELADO` por padrão (quando nenhum status é informado).
- Para visualizar eventos cancelados, o frontend deve solicitar explicitamente `status=CANCELADO`.
- A opção **"Mostrar cancelados"** na Agenda da Fazenda altera o filtro atual para buscar especificamente eventos cancelados.

## Validação de Datas (Fuso Horário)

- **Input**: O frontend utiliza inputs `datetime-local` para datas de realização.
- **Envio (Payload)**: Ao marcar um evento como realizado (`/done`), a data (`performedAt`) é enviada no formato `LocalDateTime` (ex: `2023-10-25T14:30:00`), **sem** sufixo de timezone (`Z`) ou offset. Isso garante que o backend interprete a data conforme o horário local da fazenda/usuário.
- **Clamping (Data Futura)**: O sistema impede o envio de datas futuras. Se o usuário selecionar uma data/hora no futuro, o sistema automaticamente ajusta (clamp) para o momento atual (`now`) antes do envio, ou exibe erro de validação.
