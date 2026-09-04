# Registro de parto e referências genealógicas (Frontend)

## Objetivo

Documentar o comportamento da tela de comunicação de parto quando a cria possui
pai local, pai de outra fazenda, pai validado pela ABCC ou apenas uma referência
genealógica declarada.

## Caso de uso

1. O usuário autorizado abre a gestação ativa da matriz e seleciona
   `Registrar parto e cria(s)`.
2. Informa a data de parto, uma ou mais crias e o RG do pai quando aplicável.
3. Para ao menos uma cria `PO` ou `PC`, a interface exige o registro do pai
   antes de enviar o comando. Para crias somente `PA`, o campo permanece
   opcional.
4. A interface envia um único `fatherRegistrationNumber` do parto e a categoria
   de cada cria ao endpoint de nascimento. A matriz do contexto é a mãe local.
5. O backend é a fonte de verdade para resolver pai e mãe, validar sexo e
   consultar a ABCC. O navegador não consulta a ABCC diretamente.

## Regras de experiência e limites

- O texto de ajuda informa que o pai pode pertencer a outra fazenda ou existir
  apenas na ABCC.
- Para `PA`, um RG não localizado pode ser aceito pelo backend como
  `DECLARADO`. A tela não promete confirmação pela ABCC nesse caso.
- Para `PO` e `PC`, o backend exige referências genealógicas identificáveis. A
  tela apenas antecipa a ausência do RG do pai; ela não duplica a validação de
  sexo, disponibilidade ABCC ou regras de domínio.
- Erros do backend, inclusive sexo incompatível (`422`) e indisponibilidade ABCC
  (`503`), são exibidos pelo mecanismo de erro do formulário. O parto não deve
  ser apresentado como “recurso não encontrado” quando a falha for uma regra
  genealógica.
- A referência de pai de outra fazenda não concede acesso, não transfere o
  animal e não altera o ownership da fazenda atual.

## Integração e genealogia exibida

- Comando de parto: `POST /api/v1/goatfarms/{farmId}/goats/{goatId}/reproduction/pregnancies/{pregnancyId}/births`.
- A árvore genealógica permanece uma consulta posterior, montada sob demanda.
  Nenhum ancestral é criado pelo frontend.
- Quando retornado pelo backend, `DECLARADO` é uma origem visual distinta de
  `LOCAL`, `ABCC` e `AUSENTE`.

## Arquivos relacionados

- `src/Pages/reproduction/ReproductionPage.tsx`
- `src/Pages/reproduction/ReproductionPage.test.ts`
- `src/Models/goatGenealogyDTO.ts`
- `src/Convertes/genealogies/normalizeGenealogyResponse.ts`
- `src/Components/goat-genealogy/GoatGenealogyTree.tsx`

## Validação documentada

- Teste da regra visual `requiresFatherRegistration` para `PA`, `PO` e `PC`.
- Validações de domínio e integração ABCC permanecem cobertas e executadas no
  backend; o frontend não cria uma segunda política de genealogia.
