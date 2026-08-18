-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "invoiceDueDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "invoiceFooterNote" TEXT;

