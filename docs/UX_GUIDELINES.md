# Mini Guideline UX - Fluxo Reprodutivo e Produtivo (CapriGestor)

Este documento define padrões visuais e comportamentais para garantir consistência no fluxo **Reprodução → Lactação → Produção de Leite**.

## 1. Estrutura de Página
- **Cabeçalho**: Deve conter título claro e breadcrumbs (ou botão de voltar) consistente.
- **Ações Principais**: Botões de ação (Novo, Editar) devem estar no canto superior direito (desktop) ou em barra fixa inferior/FAB (mobile).
- **Feedback Visual**:
  - Sucesso: Toast verde (top-right).
  - Erro: Toast vermelho + mensagem inline se possível.
  - Loading: Skeleton screens para carregamento inicial; Spinners nos botões para ações de submit.

## 2. Padrões de Conteúdo (Cards e Labels)
- **Datas**: Formato `dd/MM/yyyy`. Se for período, usar "Início: dd/MM/yyyy" ou "De X até Y".
- **Status**:
  - `ACTIVE` / `OPEN`: Badge Verde ("Ativa", "Aberta").
  - `CLOSED` / `DRY`: Badge Cinza ("Encerrada", "Seca").
- **Listas Vazias (Empty States)**:
  - Sempre exibir ícone ilustrativo, mensagem clara ("Nenhuma produção registrada") e botão de ação ("Registrar Produção").

## 3. Comportamentos Específicos

### Sumário de Lactação
- **Período**: Não usar apenas "Período". Mostrar "Início" e "Dias em Lactação" (duração).
- **Status**: Evitar redundância se a data de fim já indica encerramento.
- **Recomendação de Secagem**: Se `dryOffRecommendation=true`, exibir banner de alerta (Amarelo/Laranja) com botão "Secar Lactação".

### Produção de Leite
- **Criação**: Pré-preencher data com "Hoje" e turno sugerido.
- **Edição**: Permitir edição inline ou modal rápido.

### Reprodução
- **Modais**: Padronizar títulos e botões de confirmação ("Confirmar Cobertura", "Salvar Diagnóstico").

## 4. Tratamento de Erros (HTTP Status)
- **422 (Unprocessable Entity)**: Erro de validação. Mostrar qual campo falhou.
- **409 (Conflict)**: Estado inconsistente (ex: tentar cobrir animal já prenhe). Explicar o motivo e ação corretiva.
- **403 (Forbidden)**: Permissão negada. Ocultar botão ou mostrar "Apenas proprietário/admin".
- **404 (Not Found)**: Recurso não encontrado. Redirecionar para lista ou mostrar "Item removido".
