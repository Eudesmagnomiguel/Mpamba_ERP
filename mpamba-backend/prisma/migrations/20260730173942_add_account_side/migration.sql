-- CreateEnum
CREATE TYPE "AccountSide" AS ENUM ('ATIVO', 'PASSIVO', 'CAPITAL_PROPRIO', 'CUSTO', 'PROVEITO');

-- AlterTable
ALTER TABLE "AccountingAccount" ADD COLUMN     "side" "AccountSide" NOT NULL DEFAULT 'ATIVO';


-- Backfill: define o lado contabilistico correto para as contas ja semeadas
-- antes desta coluna existir (todas vieram de DEFAULT_ACCOUNTS, side conhecido por codigo).
UPDATE "AccountingAccount" SET "side" = 'ATIVO' WHERE code IN ('1', '11', '12', '2', '21', '2433', '3', '32', '4', '42');
UPDATE "AccountingAccount" SET "side" = 'PASSIVO' WHERE code IN ('22', '24', '2432');
UPDATE "AccountingAccount" SET "side" = 'CAPITAL_PROPRIO' WHERE code IN ('5', '51', '59', '8', '88');
UPDATE "AccountingAccount" SET "side" = 'CUSTO' WHERE code IN ('6', '61', '62', '63', '68');
UPDATE "AccountingAccount" SET "side" = 'PROVEITO' WHERE code IN ('7', '71', '72', '78');

