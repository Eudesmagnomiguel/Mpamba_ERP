import type {
	CreateInvoiceDto,
	UpdateInvoiceDto,
	CancelInvoiceDto,
	MarkPaymentStatusDto,
} from '../../../shared/dto/billing.dto.js';
import { BaseBillingService } from './base.service.js';
import { prisma } from '../../../config/prisma.config.js';
import { eventBus, EVENTS } from '../../../shared/utils/event-bus.js';

export class InvoiceService extends BaseBillingService {
	/** Filtro partilhado pela listagem paginada e pela exportação. */
	private buildListWhere(params?: { search?: string; status?: string }) {
		const orgId = this.orgId;
		const search = typeof params?.search === 'string' ? params.search.trim() : '';
		const status = typeof params?.status === 'string' ? params.status.trim() : '';

		const where: any = orgId ? { organizationId: orgId } : {};

		if (search.length > 0) {
			where.OR = [
				{ number: { contains: search } },
				{ customerName: { contains: search } },
			];
		}

		if (status.length > 0) {
			where.status = status;
		}

		return where;
	}

	/**
	 * Todas as faturas que correspondem ao filtro, sem paginação — a exportação
	 * tem de trazer o conjunto completo, não só a página visível.
	 */
	async listInvoicesForExport(params?: { search?: string; status?: string }) {
		return prisma.invoice.findMany({
			where: this.buildListWhere(params),
			orderBy: { createdAt: 'desc' },
		});
	}

	async listInvoices(params?: { search?: string; status?: string; page?: number; limit?: number }) {
		const page = Number.isFinite(params?.page) && (params?.page as number) > 0 ? (params?.page as number) : 1;
		const limit = Number.isFinite(params?.limit) && (params?.limit as number) > 0 ? (params?.limit as number) : 20;
		const skip = (page - 1) * limit;

		const where = this.buildListWhere(params);

		const [data, total] = await Promise.all([
			prisma.invoice.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			prisma.invoice.count({ where }),
		]);

		return {
			data,
			meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
		};
	}

	async createInvoice(data: CreateInvoiceDto) {
		const orgId = this.orgId;
		const userId = this.userId;

		const { items, totals } = await this.calculateTotals(prisma, orgId, data.items, data.customerId ?? null);

		let dueDate = data.dueDate;
		if (!dueDate) {
			const organization = await prisma.organization.findUnique({ where: { id: orgId }, select: { invoiceDueDays: true } });
			const days = organization?.invoiceDueDays ?? 30;
			dueDate = new Date();
			dueDate.setDate(dueDate.getDate() + days);
		}

		return prisma.invoice.create({
			data: {
				...data,
				...totals,
				dueDate,
				organizationId: orgId,
				userId,
				status: 'DRAFT',
				items: {
					create: items,
				},
			},
			include: { items: true },
		});
	}

	async updateInvoice(id: string, data: UpdateInvoiceDto) {
		const orgId = this.orgId;

		const invoice = await prisma.invoice.findFirst({
			where: { id, organizationId: orgId },
			include: { items: true },
		});

		if (!invoice) throw new Error('Fatura não encontrada');
		if (invoice.status !== 'DRAFT') throw new Error('Apenas faturas em rascunho (DRAFT) podem ser editadas');

		const { items, ...otherData } = data;
		let updateData: any = { ...otherData };
		const customerId = data.customerId !== undefined ? data.customerId : invoice.customerId;
		const shouldRecalculate = items !== undefined || data.customerId !== undefined;

		if (shouldRecalculate) {
			const sourceItems = (items ?? invoice.items).map((item: any) => ({
				productId: item.productId ?? undefined,
				serviceId: item.serviceId ?? undefined,
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				taxRate: item.baseTaxRate ?? item.taxRate ?? 0,
				discount: item.discount ?? 0,
			}));

			const { items: calculatedItems, totals } = await this.calculateTotals(prisma, orgId, sourceItems as any, customerId);
			updateData = {
				...updateData,
				...totals,
				items: {
					deleteMany: {},
					create: calculatedItems,
				},
			};
		}

		return prisma.invoice.update({
			where: { id },
			data: updateData,
			include: { items: true },
		});
	}

	async getInvoiceById(id: string) {
		const orgId = this.orgId;
		const where: any = { id };
		if (orgId) {
			where.organizationId = orgId;
		}

		const invoice = await prisma.invoice.findFirst({
			where,
			include: {
				items: true,
				series: true,
				organization: {
					select: { name: true, nif: true, address: true, phone: true, invoiceFooterNote: true }
				}
			},
		});
		if (!invoice) throw new Error('Fatura não encontrada');
		return invoice;
	}

	async issueInvoice(id: string) {
		const orgId = this.orgId;

		return prisma.$transaction(async (tx) => {
			const invoice = await tx.invoice.findFirst({
				where: { id, organizationId: orgId },
				include: { items: true },
			});

			if (!invoice) throw new Error('Fatura não encontrada');
			if (invoice.status !== 'DRAFT') throw new Error(`Esta fatura já está no estado ${invoice.status}`);
			if (invoice.items.length === 0) throw new Error('A fatura deve ter pelo menos um item para ser emitida');

			const { totals } = await this.calculateTotals(
				tx,
				orgId,
				invoice.items.map((item: any) => ({
					productId: item.productId ?? undefined,
					serviceId: item.serviceId ?? undefined,
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					taxRate: item.baseTaxRate ?? item.taxRate ?? 0,
					discount: item.discount ?? 0,
				})),
				invoice.customerId,
			);

			const invoiceNumber = await this.generateDocumentNumber(tx, invoice.seriesId);

			const issuedInvoice = await tx.invoice.update({
				where: { id },
				data: {
					...totals,
					number: invoiceNumber,
					status: 'ISSUED',
					date: new Date(),
				},
				include: { items: true },
			});

			eventBus.emitEvent(EVENTS.BILLING.INVOICE_ISSUED, issuedInvoice);
			return issuedInvoice;
		});
	}

	async cancelInvoice(id: string, data: CancelInvoiceDto) {
		const orgId = this.orgId;

		const invoice = await prisma.invoice.findFirst({
			where: { id, organizationId: orgId },
		});

		if (!invoice) throw new Error('Fatura não encontrada');
		if (invoice.status !== 'ISSUED') throw new Error('Apenas faturas emitidas (ISSUED) podem ser canceladas');

		const cancelledInvoice = await prisma.invoice.update({
			where: { id },
			data: {
				status: 'CANCELLED',
				cancelReason: data.reason,
			},
		});

		eventBus.emitEvent(EVENTS.BILLING.INVOICE_CANCELLED, cancelledInvoice);
		return cancelledInvoice;
	}

	async duplicateInvoice(id: string) {
		const orgId = this.orgId;
		const userId = this.userId;

		const original = await prisma.invoice.findFirst({
			where: { id, organizationId: orgId },
			include: { items: true },
		});

		if (!original) throw new Error('Fatura original não encontrada');

		const { id: _, number: __, status: ___, createdAt: ____, updatedAt: _____, items, ...baseData } = original;

		return prisma.invoice.create({
			data: {
				...baseData,
				status: 'DRAFT',
				userId,
				items: {
					create: items.map(({ id: _, invoiceId: __, createdAt: ___, updatedAt: ____, baseTaxRate: _____, taxBreakdown, ...itemData }) => ({
						...itemData,
						productId: itemData.productId ?? undefined,
						serviceId: itemData.serviceId ?? undefined,
						taxBreakdown: taxBreakdown ?? undefined,
					})),
				},
			},
			include: { items: true },
		});
	}

	async markPaymentStatus(invoiceId: string, data: MarkPaymentStatusDto) {
		const orgId = this.orgId;
		const invoice = await this.getInvoiceById(invoiceId);

		const amountPaid = data.amountPaid !== undefined ? data.amountPaid : invoice.amountPaid;

		return prisma.invoice.update({
			where: { id: invoiceId, organizationId: orgId },
			data: {
				paymentStatus: data.status as any,
				amountPaid
			},
			include: { items: true }
		});
	}

	async deleteInvoice(id: string) {
		throw new Error('Regra Fiscal: Faturas não podem ser eliminadas do sistema. Use o cancelamento para documentos emitidos.');
	}
}

export const invoiceService = new InvoiceService();
