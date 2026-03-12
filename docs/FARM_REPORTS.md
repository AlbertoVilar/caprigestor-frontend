# Relatórios da fazenda

## Estratégia incremental adotada

A primeira camada de relatórios foi implementada sem backend novo, reutilizando contratos já existentes.

## Cobertura entregue

- visão geral da fazenda com métricas e alertas resumidos
- relatório de sanidade por fazenda
- relatório de estoque por fazenda
- relatório de reprodução por cabra
- relatório de leite e lactação por cabra
- exportação CSV por aba
- versão amigável para impressão via navegador

## Limites explícitos

- reprodução e lactação ainda dependem de seleção de cabra porque o backend atual expõe histórico operacional nesse recorte
- não foi criado endpoint de exportação nem módulo de BI
- a área prioriza relatórios operacionais úteis e rastreáveis
