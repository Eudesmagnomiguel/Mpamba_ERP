import { prisma } from '../../../config/prisma.config.js';
import { eventBus, EVENTS } from '../../../shared/utils/event-bus.js';
import { BaseBillingService } from './base.service.js';

export class ReceiptService extends BaseBillingService {
	async createReceipt(data: any) {
		const orgId = this.orgId;
		const userId = this.userId;
		const { seriesId, invoiceId, ...receiptData } = data;

		const invoice = await prisma.invoice.findFirst({
			where: { id: invoiceId, organizationId: orgId }
		});
		if (!invoice) throw new Error('Fatura não encontrada');

		const series = await prisma.invoiceSeries.findFirst({
			where: { id: seriesId, organizationId: orgId }
		});
		if (!series) throw new Error('Série de recibo não encontrada');

		const receipt = await prisma.receipt.create({
			data: {
				...receiptData,
				organizationId: orgId,
				seriesId,
				userId,
				invoiceId
			}
		});

		eventBus.emit(EVENTS.RECEIPT_CREATED, { receiptId: receipt.id, invoiceId, organizationId: orgId });
		return receipt;
	}

	async listReceipts(params?: { invoiceId?: string; search?: string }) {
		const orgId = this.orgId;
		const where: any = orgId ? { organizationId: orgId } : {};

		if (params?.invoiceId) where.invoiceId = params.invoiceId;
		if (params?.search) {
			where.OR = [
				{ number: { contains: params.search, mode: 'insensitive' } },
				{ reference: { contains: params.search, mode: 'insensitive' } },
			];
		}

		return prisma.receipt.findMany({
			where,
			include: { invoice: true },
			orderBy: { createdAt: 'desc' },
		});
	}

	async getReceiptById(id: string) {
		const orgId = this.orgId;
		const where: any = { id };
		if (orgId) {
			where.organizationId = orgId;
		}

		const receipt = await prisma.receipt.findFirst({
			where,
			include: { 
				invoice: true,
				organization: true,
				series: true
			}
		});
		if (!receipt) throw new Error('Recibo não encontrado');
		return receipt;
	}

	async issueReceipt(id: string) {
		const orgId = this.orgId;

		return prisma.$transaction(async (tx) => {
			const receipt = await tx.receipt.findFirst({
				where: { id, organizationId: orgId },
				include: { invoice: true }
			});

			if (!receipt) throw new Error('Recibo não encontrado');
			if (receipt.status === 'ISSUED') throw new Error('Este recibo já foi emitido');

			const nextNumber = await this.generateDocumentNumber(tx, receipt.seriesId);

			const updated = await tx.receipt.update({
				where: { id },
				data: {
					status: 'ISSUED',
					number: nextNumber,
					date: new Date()
				}
			});

			eventBus.emit(EVENTS.RECEIPT_ISSUED, { receiptId: id, organizationId: orgId });
			return updated;
		});
	}

	async cancelReceipt(id: string) {
		const orgId = this.orgId;
		return prisma.receipt.update({
			where: { id, organizationId: orgId },
			data: { status: 'CANCELLED' }
		});
	}
}

export const receiptService = new ReceiptService();
