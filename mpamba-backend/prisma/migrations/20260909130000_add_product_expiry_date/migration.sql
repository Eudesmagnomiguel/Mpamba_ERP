-- Validade dos produtos. Nulo para os produtos que nao expiram (nao pereciveis),
-- que e o estado de todos os produtos ja registados.
-- "expiryAlertedAt" guarda o momento em que o alerta de validade foi enviado,
-- para o AlertsService nao repetir o mesmo aviso todos os dias.
ALTER TABLE "Product" ADD COLUMN     "expiryDate" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN     "expiryAlertedAt" TIMESTAMP(3);

-- Suporta a listagem e o alerta diario de produtos a expirar, que filtram por
-- data de validade dentro da organizacao.
CREATE INDEX "Product_organizationId_expiryDate_idx" ON "Product"("organizationId", "expiryDate");
