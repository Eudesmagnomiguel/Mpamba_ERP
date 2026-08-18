import { prisma } from '../../../config/prisma.config.js';
import type { InvoiceItemDto } from '../../../shared/dto/billing.dto.js';
import { organizationContext } from '../../../shared/utils/organization.context.js';

export abstract class BaseBillingService {
	protected get orgId(): string {
		const id = organizationContext.getOrganizationId();
		const isSuperAdmin = organizationContext.isSuperAdmin();
		
		if (!id && !isSuperAdmin) {
			console.error(`[BaseBillingService] Unauthorized access: Missing organization context for non-super-admin user. Store:`, organizationContext.getStore());
			throw new Error('Contexto de organização obrigatório para faturação');
		}
		
		// For Super Admin, we might return an empty string or null, 
		// but the services should handle how to filter data.
		// For now, return the id (which might be undefined/null for Super Admin)
		return id || '';
	}

	protected get userId(): string {
		const id = organizationContext.getUserId();
		if (!id) throw new Error('Contexto de usuário obrigatório para faturação');
		return id;
	}

	/**
	 * Calcula totais de itens e do documento completo.
	 * Backend é a fonte da verdade.
	 */
	protected async calculateTotals(client: any, orgId: string, items: InvoiceItemDto[], customerId?: string | null) {
		const serviceIds = [...new Set(items.map((item) => item.serviceId).filter(Boolean))] as string[];

		const [customer, services, taxRules] = await Promise.all([
			customerId
				? client.customer.findFirst({
					where: { id: customerId, organizationId: orgId },
					select: { id: true, category: true },
				})
				: Promise.resolve(null),
			serviceIds.length
				? client.service.findMany({
					where: { id: { in: serviceIds }, organizationId: orgId },
					select: { id: true, taxRate: true, category: true },
				})
				: Promise.resolve([]),
			client.taxRule.findMany({
				where: { organizationId: orgId, isActive: true },
				orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
			}),
		]);

		const servicesById = new Map((services as any[]).map((service: any) => [service.id, service]));
		const customerCategory = customer?.category ?? null;

		const isRuleMatch = (rule: any, itemService: any) => {
			switch (rule.scope) {
				case 'GLOBAL':
					return true;
				case 'CUSTOMER':
					return !!customerId && rule.targetValue === customerId;
				case 'CUSTOMER_CATEGORY':
					return !!customerCategory && rule.targetValue === customerCategory;
				case 'SERVICE':
					return !!itemService?.id && rule.targetValue === itemService.id;
				case 'SERVICE_CATEGORY':
					return !!itemService?.category && rule.targetValue === itemService.category;
				default:
					return false;
			}
		};

		let subtotal = 0;
		let discountTotal = 0;
		let taxTotal = 0;

		const calculatedItems = items.map((item) => {
			const service = item.serviceId ? servicesById.get(item.serviceId) : null;
			const itemSubtotal = item.quantity * item.unitPrice;
			const itemTaxBase = itemSubtotal - item.discount;
			const baseTaxRate = typeof item.taxRate === 'number' ? item.taxRate : (service as any)?.taxRate ?? 0;
			const matchedRules = taxRules.filter((rule: any) => isRuleMatch(rule, service));
			const exemptionRule = matchedRules.find((rule: any) => rule.kind === 'EXEMPTION');
			const ruleTaxRate = exemptionRule
				? 0
				: matchedRules
					.filter((rule: any) => rule.kind !== 'EXEMPTION')
					.reduce((sum: number, rule: any) => sum + Number(rule.rate || 0), 0);
			const effectiveTaxRate = exemptionRule ? 0 : baseTaxRate + ruleTaxRate;
			const itemTaxAmount = itemTaxBase * (effectiveTaxRate / 100);
			const itemTotal = itemTaxBase + itemTaxAmount;

			subtotal += itemSubtotal;
			discountTotal += item.discount;
			taxTotal += itemTaxAmount;

			return {
				...item,
				productId: item.productId || null,
				serviceId: item.serviceId || null,
				baseTaxRate,
				taxRate: effectiveTaxRate,
				taxBreakdown: matchedRules.map((rule: any) => ({
					id: rule.id,
					name: rule.name,
					kind: rule.kind,
					scope: rule.scope,
					targetValue: rule.targetValue,
					rate: Number(rule.rate || 0),
					effect: rule.kind === 'EXEMPTION' ? 'EXEMPTION' : 'ADDITIVE',
				})),
				subtotal: itemSubtotal,
				taxAmount: itemTaxAmount,
				total: itemTotal,
			};
		});

		return {
			items: calculatedItems,
			totals: {
				subtotal,
				discountTotal,
				taxTotal,
				total: subtotal - discountTotal + taxTotal,
			},
		};
	}

	/**
	 * 🔢 Gerar Número de Documento
	 * LOCK na série para evitar duplicação em ambientes concorrentes
	 */
	protected async generateDocumentNumber(tx: any, seriesId: string) {
		const series = await tx.$queryRaw`
			SELECT * FROM "InvoiceSeries" 
			WHERE id = ${seriesId} 
			FOR UPDATE
		`;

		if (!series || series.length === 0) throw new Error('Série de faturação não encontrada');
		const s = series[0];

		const sequenceStr = String(s.nextSequence).padStart(6, '0');
		const number = `${s.prefix}-${s.year}-${sequenceStr}`;

		await tx.invoiceSeries.update({
			where: { id: seriesId },
			data: { nextSequence: { increment: 1 } },
		});

		return number;
	}
}
