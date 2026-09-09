-- Alinha o plano de contas com o PGC-Angola (Decreto n.º 82/01 de 16 de Novembro).
--
-- O plano semeado até aqui seguia a estrutura anterior ao decreto (1 Meios
-- Monetarios, 2 Terceiros, 3 Existencias, 4 Meios Fixos, 6 Custos, 7 Proveitos).
-- O decreto trocou as classes, pelo que quase todos os codigos mudam de
-- significado. Esta migracao renumera as contas ja existentes -- mantendo a
-- mesma linha, e portanto os lancamentos e saldos que lhe estao ligados -- para
-- o codigo equivalente no plano novo. As contas do plano que faltarem sao
-- criadas pela aplicacao (AccountingAccountService.ensureDefaultAccounts), que
-- tambem reconstroi a hierarquia anulada no passo 1.
--
-- As organizacoes visadas sao as que tenham a conta 2432: codigos de 4 digitos
-- nao existem no PGC 82/01, pelo que a sua presenca identifica sem ambiguidade
-- o plano antigo. Como 2432 era uma conta-ancora dos lancamentos automaticos,
-- nao podia ter sido eliminada.

-- 1. Desliga a hierarquia antiga; a aplicacao religa as contas pelo codigo novo.
UPDATE "AccountingAccount"
SET "parentId" = NULL
WHERE "organizationId" IN (
  SELECT "organizationId" FROM "AccountingAccount" WHERE code = '2432'
);

-- 2. Prefixa os codigos a renumerar. Sem este passo intermedio, renomear
--    42 -> 11 colidiria com o 11 antigo (Caixa) na unique (code, organizationId).
UPDATE "AccountingAccount"
SET code = '~' || code
WHERE "organizationId" IN (
  SELECT "organizationId" FROM "AccountingAccount" WHERE code = '2432'
)
AND code IN ('11', '12', '21', '22', '24', '2432', '2433', '32', '42', '59', '61', '62', '63', '68', '71', '72', '78');

-- 3. Renumera cada conta para o codigo, nome, classe e lado do plano novo.
UPDATE "AccountingAccount" SET code = '45.1',   name = 'Fundo fixo',                                     class = 4, side = 'ATIVO'           WHERE code = '~11';
UPDATE "AccountingAccount" SET code = '43.1',   name = 'Moeda nacional',                                 class = 4, side = 'ATIVO'           WHERE code = '~12';
UPDATE "AccountingAccount" SET code = '31.1',   name = 'Clientes – correntes',                           class = 3, side = 'ATIVO'           WHERE code = '~21';
UPDATE "AccountingAccount" SET code = '32.1',   name = 'Fornecedores – correntes',                       class = 3, side = 'PASSIVO'         WHERE code = '~22';
UPDATE "AccountingAccount" SET code = '34',     name = 'Estado',                                         class = 3, side = 'PASSIVO'         WHERE code = '~24';
UPDATE "AccountingAccount" SET code = '34.5.3', name = 'IVA liquidado',                                  class = 3, side = 'PASSIVO'         WHERE code = '~2432';
UPDATE "AccountingAccount" SET code = '34.5.2', name = 'IVA dedutível',                                  class = 3, side = 'ATIVO'           WHERE code = '~2433';
UPDATE "AccountingAccount" SET code = '26',     name = 'Mercadorias',                                    class = 2, side = 'ATIVO'           WHERE code = '~32';
UPDATE "AccountingAccount" SET code = '11',     name = 'Imobilizações corpóreas',                        class = 1, side = 'ATIVO'           WHERE code = '~42';
UPDATE "AccountingAccount" SET code = '81',     name = 'Resultados transitados',                         class = 8, side = 'CAPITAL_PROPRIO' WHERE code = '~59';
UPDATE "AccountingAccount" SET code = '71.6',   name = 'Mercadorias',                                    class = 7, side = 'CUSTO'           WHERE code = '~61';
UPDATE "AccountingAccount" SET code = '75.2',   name = 'Fornecimentos e serviços de terceiros',          class = 7, side = 'CUSTO'           WHERE code = '~62';
UPDATE "AccountingAccount" SET code = '72',     name = 'Custos com o pessoal',                           class = 7, side = 'CUSTO'           WHERE code = '~63';
UPDATE "AccountingAccount" SET code = '76',     name = 'Custos e perdas financeiros gerais',             class = 7, side = 'CUSTO'           WHERE code = '~68';
UPDATE "AccountingAccount" SET code = '61.3',   name = 'Mercadorias',                                    class = 6, side = 'PROVEITO'        WHERE code = '~71';
UPDATE "AccountingAccount" SET code = '62.1',   name = 'Serviços principais',                            class = 6, side = 'PROVEITO'        WHERE code = '~72';
UPDATE "AccountingAccount" SET code = '66',     name = 'Proveitos e ganhos financeiros gerais',          class = 6, side = 'PROVEITO'        WHERE code = '~78';

-- 51 Capital e 88 Resultado liquido do exercicio mantem codigo, classe e lado
-- no plano novo, pelo que ficam como estao.

-- 4. As contas de 1 digito ('1' a '8') eram os agregadores de classe do plano
--    antigo. O PGC nao cria contas de 1 digito -- "1 -- Meios fixos e
--    investimentos" e o titulo da classe -- e a interface passou a agrupar pela
--    classe, pelo que estas contas deixam de fazer sentido.
DELETE FROM "AccountingAccount"
WHERE "organizationId" IN (
  SELECT "organizationId" FROM "AccountingAccount" WHERE code = '34.5.3'
)
AND code IN ('1', '2', '3', '4', '5', '6', '7', '8')
AND NOT EXISTS (
  SELECT 1 FROM "JournalEntryLine" l WHERE l."accountId" = "AccountingAccount".id
);

-- Se alguma dessas contas tiver lancamentos manuais nao pode ser eliminada.
-- Fica identificada como sendo do plano antigo, para o utilizador a reclassificar.
UPDATE "AccountingAccount"
SET name = name || ' (plano antigo)'
WHERE code IN ('1', '2', '3', '4', '5', '6', '7', '8')
AND name NOT LIKE '% (plano antigo)';
