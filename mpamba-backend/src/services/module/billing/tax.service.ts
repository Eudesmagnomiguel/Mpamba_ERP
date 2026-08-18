import { prisma } from '../../../config/prisma.config.js';
import type { CreateTaxRuleDto, UpdateTaxRuleDto } from '../../../shared/dto/billing.dto.js';
import { BaseBillingService } from './base.service.js';

export class TaxService extends BaseBillingService {
	async listTaxRules() {
		return prisma.taxRule.findMany({
			where: { organizationId: this.orgId },
			orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
		});
	}

	async createTaxRule(data: CreateTaxRuleDto) {
		const orgId = this.orgId;
		return prisma.taxRule.create({
			data: {
				...data,
				organizationId: orgId,
				targetValue: data.scope === 'GLOBAL' ? null : data.targetValue ?? null,
			},
		});
	}

	async updateTaxRule(id: string, data: UpdateTaxRuleDto) {
		const orgId = this.orgId;
		const updateData: any = { ...data };

		if (data.scope === 'GLOBAL') {
			updateData.targetValue = null;
		} else if (data.scope && data.targetValue !== undefined) {
			updateData.targetValue = data.targetValue;
		}

		return prisma.taxRule.update({
			where: { id, organizationId: orgId },
			data: updateData,
		});
	}

	async deleteTaxRule(id: string) {
		const orgId = this.orgId;
		return prisma.taxRule.update({
			where: { id, organizationId: orgId },
			data: { isActive: false },
		});
	}
}

export const taxService = new TaxService();
