import { prisma } from '../../../config/prisma.config.js';
import { BaseBillingService } from './base.service.js';
import { productService } from '../stock/product.service.js';
import { eventBus, EVENTS } from '../../../shared/utils/event-bus.js';
import type { PosCheckoutDto } from '../../../shared/dto/pos.dto.js';

const DEFAULT_TAX_RATE = 14;

export class PosService extends BaseBillingService {
	/**
	 * 🛒 Finaliza uma venda de balcão (POS): cria fatura emitida + recibo pago,
	 * e dá baixa automática no stock de cada produto vendido.
	 */
	async checkout(data: PosCheckoutDto) {
		const orgId = this.orgId;
		const userId = this.userId;

		return prisma.$transaction(async (tx) => {
			const productIds = [...new Set(data.items.map((i) => i.productId))];
			const products = await tx.product.findMany({
				where: { id: { in: productIds }, organizationId: orgId },
			});
			const productMap = new Map(products.map((p) => [p.id, p]));

			for (const item of data.items) {
				const product = productMap.get(item.productId);
				if (!product) throw new Error('Produto não encontrado');
				if (!product.isActive) throw new Error(`Produto "${product.name}" está desativado`);
				if (product.currentQuantity < item.quantity) {
					throw new Error(
						`Estoque insuficiente para "${product.name}". Disponível: ${product.currentQuantity} ${product.unit}.`
					);
				}
			}

			const invoiceItemsInput = data.items.map((item) => {
				const product = productMap.get(item.productId)!;
				return {
					productId: product.id,
					description: product.name,
					quantity: item.quantity,
					unitPrice: product.price || 0,
					taxRate: DEFAULT_TAX_RATE,
					discount: 0,
				};
			});

			const { items: calculatedItems, totals } = await this.calculateTotals(
				tx,
				orgId,
				invoiceItemsInput as any,
				data.customerId ?? null
			);

			const organization = await tx.organization.findUnique({
				where: { id: orgId },
				select: { posInvoiceThreshold: true },
			});

			const invoiceSeries = await tx.invoiceSeries.findFirst({
				where: { organizationId: orgId, prefix: 'FT', isActive: true },
			});
			if (!invoiceSeries) throw new Error('Série de faturas (FT) não configurada para esta organização');

			const receiptSeries = await tx.invoiceSeries.findFirst({
				where: { organizationId: orgId, prefix: 'RC', isActive: true },
			});
			if (!receiptSeries) throw new Error('Série de recibos (RC) não configurada para esta organização');

			const invoiceNumber = await this.generateDocumentNumber(tx, invoiceSeries.id);

			const invoice = await tx.invoice.create({
				data: {
					seriesId: invoiceSeries.id,
					customerId: data.customerId ?? null,
					customerName: data.customerName || 'Cliente Balcão',
					organizationId: orgId,
					userId,
					status: 'ISSUED',
					number: invoiceNumber,
					date: new Date(),
					...totals,
					items: { create: calculatedItems },
				},
				include: { items: true },
			});

			const receiptNumber = await this.generateDocumentNumber(tx, receiptSeries.id);

			const receipt = await tx.receipt.create({
				data: {
					seriesId: receiptSeries.id,
					invoiceId: invoice.id,
					organizationId: orgId,
					userId,
					status: 'ISSUED',
					number: receiptNumber,
					date: new Date(),
					amount: totals.total,
					paymentMethod: data.paymentMethod,
				},
			});

			for (const item of data.items) {
				const product = productMap.get(item.productId)!;

				await tx.stockMovement.create({
					data: {
						productId: product.id,
						type: 'SAIDA',
						quantity: item.quantity,
						reference: invoice.number,
						reason: 'Venda no Posto de Venda (POS)',
						userId,
						organizationId: orgId,
					},
				});

				const updated = await tx.product.update({
					where: { id: product.id },
					data: { currentQuantity: { decrement: item.quantity } },
				});

				productService.checkLowStock(updated, product);
			}

			eventBus.emitEvent(EVENTS.BILLING.INVOICE_ISSUED, invoice);

			const threshold = organization?.posInvoiceThreshold ?? 50000;
			const recommendedDocument: 'INVOICE' | 'RECEIPT' = totals.total >= threshold ? 'INVOICE' : 'RECEIPT';

			return { invoice, receipt, recommendedDocument };
		});
	}
}

export const posService = new PosService();
