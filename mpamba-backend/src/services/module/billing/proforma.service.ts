import { prisma } from '../../../config/prisma.config.js';
import { eventBus, EVENTS } from '../../../shared/utils/event-bus.js';
import { BaseBillingService } from './base.service.js';
import { invoiceService } from './invoice.service.js';

export class ProformaService extends BaseBillingService {
	async createProforma(data: any) {
		const orgId = this.orgId;
		const userId = this.userId;
		const { items, seriesId, ...proformaData } = data;

		return prisma.$transaction(async (tx) => {
			const series = await tx.invoiceSeries.findFirst({
				where: { id: seriesId, organizationId: orgId }
			});
			if (!series) throw new Error('Série de proforma não encontrada');

			const { items: calculatedItems, totals } = await this.calculateTotals(
				tx,
				orgId,
				items,
				data.customerId
			);

			const proformaNumber = await this.generateDocumentNumber(tx, seriesId);

			const proforma = await tx.proforma.create({
				data: {
					...proformaData,
					number: proformaNumber,
					organizationId: orgId,
					seriesId,
					userId,
					subtotal: totals.subtotal,
					discountTotal: totals.discountTotal,
					taxTotal: totals.taxTotal,
					total: totals.total,
					items: {
						create: calculatedItems.map(item => ({
							description: item.description,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							serviceId: item.serviceId,
							taxRate: item.taxRate,
							discount: item.discount,
							taxBreakdown: item.taxBreakdown,
							subtotal: item.subtotal,
							taxAmount: item.taxAmount,
							total: item.total,
						}))
					}
				},
				include: { items: true }
			});

			eventBus.emit(EVENTS.PROFORMA_CREATED, { proformaId: proforma.id, organizationId: orgId });
			return proforma;
		});
	}

	async listProformas(params?: { search?: string; status?: string }) {
		const orgId = this.orgId;
		const where: any = orgId ? { organizationId: orgId } : {};

		if (params?.status) where.status = params.status;
		if (params?.search) {
			where.OR = [
				{ number: { contains: params.search, mode: 'insensitive' } },
				{ customerName: { contains: params.search, mode: 'insensitive' } },
			];
		}

		return prisma.proforma.findMany({
			where,
			include: { items: true, customer: true },
			orderBy: { createdAt: 'desc' },
		});
	}

	async getProformaById(id: string) {
		const orgId = this.orgId;
		const where: any = { id };
		if (orgId) {
			where.organizationId = orgId;
		}

		const proforma = await prisma.proforma.findFirst({
			where,
			include: { 
				items: true, 
				customer: true,
				organization: true,
				series: true
			}
		});
		if (!proforma) throw new Error('Proforma não encontrada');
		return proforma;
	}

	async updateProforma(id: string, data: any) {
		const orgId = this.orgId;
		const { items, ...updateData } = data;

		if (items) {
			await prisma.proformaItem.deleteMany({ where: { proformaId: id } });
			const { items: calculatedItems, totals } = await this.calculateTotals(
				prisma,
				orgId,
				items,
				data.customerId
			);

			updateData.subtotal = totals.subtotal;
			updateData.discountTotal = totals.discountTotal;
			updateData.taxTotal = totals.taxTotal;
			updateData.total = totals.total;
		}

		return prisma.proforma.update({
			where: { id, organizationId: orgId },
			data: {
				...updateData,
				...(items ? {
					items: {
						create: items.map((item: any) => ({
							description: item.description,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							serviceId: item.serviceId,
							taxRate: item.taxRate,
							discount: item.discount,
							taxBreakdown: item.taxBreakdown,
							subtotal: item.subtotal,
							taxAmount: item.taxAmount,
							total: item.total,
						}))
					}
				} : {})
			},
			include: { items: true }
		});
	}

	async convertProformaToInvoice(proformaId: string, data?: any) {
		const orgId = this.orgId;
		const proforma = await this.getProformaById(proformaId);

		if (proforma.invoiceId) {
			throw new Error('Esta proforma já foi convertida em fatura');
		}

		const series = await prisma.invoiceSeries.findFirst({
			where: { prefix: 'FT', organizationId: orgId }
		});
		if (!series) throw new Error('Série de fatura FT não encontrada');

		const invoiceData = {
			seriesId: series.id,
			customerId: data?.customerId || proforma.customerId,
			customerName: data?.customerName || proforma.customerName,
			customerNif: data?.customerNif || proforma.customerNif,
			customerAddress: data?.customerAddress || proforma.customerAddress,
			currency: proforma.currency,
			notes: data?.notes || proforma.notes,
			items: proforma.items.map(item => ({
				serviceId: item.serviceId,
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				taxRate: item.taxRate,
				discount: item.discount,
			}))
		};

		const invoice = await invoiceService.createInvoice(invoiceData as any);

		await prisma.proforma.update({
			where: { id: proformaId },
			data: { invoiceId: invoice.id, status: 'CONVERTED' }
		});

		eventBus.emit(EVENTS.PROFORMA_CONVERTED, { proformaId, invoiceId: invoice.id, organizationId: orgId });
		return invoice;
	}

	async cancelProforma(id: string) {
		const orgId = this.orgId;
		return prisma.proforma.update({
			where: { id, organizationId: orgId },
			data: { status: 'EXPIRED' }
		});
	}
}

export const proformaService = new ProformaService();
