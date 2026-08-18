import { prisma } from '../../../config/prisma.config.js';
import { eventBus, EVENTS } from '../../../shared/utils/event-bus.js';
import { BaseBillingService } from './base.service.js';

export class CreditNoteService extends BaseBillingService {
	async createCreditNote(data: any) {
		const orgId = this.orgId;
		const userId = this.userId;
		const { items, seriesId, invoiceId, ...creditNoteData } = data;

		const invoice = await prisma.invoice.findFirst({
			where: { id: invoiceId, organizationId: orgId }
		});
		if (!invoice) throw new Error('Fatura não encontrada');

		const series = await prisma.invoiceSeries.findFirst({
			where: { id: seriesId, organizationId: orgId }
		});
		if (!series) throw new Error('Série de nota de crédito não encontrada');

		let creditNoteItems: any[] = [];
		let calculatedAmount = data.amount;

		if (items && items.length > 0) {
			const { items: calced } = await this.calculateTotals(prisma, orgId, items);
			creditNoteItems = calced;
			calculatedAmount = calced.reduce((sum: number, item: any) => sum + item.total, 0);
		}

		const creditNote = await prisma.creditNote.create({
			data: {
				...creditNoteData,
				organizationId: orgId,
				seriesId,
				userId,
				invoiceId,
				amount: calculatedAmount,
				items: creditNoteItems.length > 0 ? {
					create: creditNoteItems.map(item => ({
						description: item.description,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						discount: item.discount,
						subtotal: item.subtotal,
						taxAmount: item.taxAmount,
						total: item.total,
					}))
				} : undefined
			},
			include: { items: true }
		});

		eventBus.emit(EVENTS.CREDIT_NOTE_CREATED, { creditNoteId: creditNote.id, invoiceId, organizationId: orgId });
		return creditNote;
	}

	async listCreditNotes(params?: { invoiceId?: string; search?: string }) {
		const orgId = this.orgId;
		const where: any = orgId ? { organizationId: orgId } : {};

		if (params?.invoiceId) where.invoiceId = params.invoiceId;
		if (params?.search) {
			where.OR = [
				{ number: { contains: params.search, mode: 'insensitive' } },
				{ reason: { contains: params.search, mode: 'insensitive' } },
			];
		}

		return prisma.creditNote.findMany({
			where,
			include: { items: true, invoice: true },
			orderBy: { createdAt: 'desc' },
		});
	}

	async getCreditNoteById(id: string) {
		const orgId = this.orgId;
		const where: any = { id };
		if (orgId) {
			where.organizationId = orgId;
		}

		const creditNote = await prisma.creditNote.findFirst({
			where,
			include: { 
				items: true, 
				invoice: true,
				organization: true,
				series: true
			}
		});
		if (!creditNote) throw new Error('Nota de crédito não encontrada');
		return creditNote;
	}

	async issueCreditNote(id: string) {
		const orgId = this.orgId;

		return prisma.$transaction(async (tx) => {
			const creditNote = await tx.creditNote.findFirst({
				where: { id, organizationId: orgId },
				include: { items: true }
			});

			if (!creditNote) throw new Error('Nota de crédito não encontrada');
			if (creditNote.status === 'ISSUED') throw new Error('Esta nota de crédito já foi emitida');

			const nextNumber = await this.generateDocumentNumber(tx, creditNote.seriesId);

			const updated = await tx.creditNote.update({
				where: { id },
				data: {
					status: 'ISSUED',
					number: nextNumber,
					date: new Date()
				},
				include: { items: true }
			});

			eventBus.emit(EVENTS.CREDIT_NOTE_ISSUED, { creditNoteId: id, organizationId: orgId });
			return updated;
		});
	}

	async cancelCreditNote(id: string) {
		const orgId = this.orgId;
		return prisma.creditNote.update({
			where: { id, organizationId: orgId },
			data: { status: 'CANCELLED' }
		});
	}
}

export const creditNoteService = new CreditNoteService();
