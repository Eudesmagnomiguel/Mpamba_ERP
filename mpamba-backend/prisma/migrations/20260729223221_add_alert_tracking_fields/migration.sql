-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN     "criticalBalanceAlertedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "overdueAlertedAt" TIMESTAMP(3);

