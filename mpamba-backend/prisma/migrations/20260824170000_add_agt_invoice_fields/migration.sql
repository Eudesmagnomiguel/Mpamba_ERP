-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "paymentCondition" TEXT,
ADD COLUMN     "requisition" TEXT,
ADD COLUMN     "retentionBase" DOUBLE PRECISION,
ADD COLUMN     "retentionEntity" TEXT,
ADD COLUMN     "retentionRate" DOUBLE PRECISION,
ADD COLUMN     "retentionValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "taxExemptionCode" TEXT,
ADD COLUMN     "taxExemptionReason" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'UN';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "agtValidationNumber" TEXT,
ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Angola',
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "retentionEntity" TEXT,
ADD COLUMN     "retentionRate" DOUBLE PRECISION,
ADD COLUMN     "taxExemptionCode" TEXT,
ADD COLUMN     "taxExemptionReason" TEXT;

