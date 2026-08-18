import { prisma } from '../../../config/prisma.config.js';
import { BaseTreasuryService } from './base.service.js';

export class CostCenterService extends BaseTreasuryService {
	async createCostCenter(data: { name: string; code?: string; description?: string }) {
		return prisma.costCenter.create({
			data: {
				...data,
				organizationId: this.orgId,
			},
		});
	}

	async getCostCenters() {
		const orgId = this.orgIdOrNull;
		if (!orgId) return [];

		return prisma.costCenter.findMany({
			where: { organizationId: orgId, isActive: true },
			orderBy: { name: 'asc' }
		});
	}

	async getCostCenterById(id: string) {
		const costCenter = await prisma.costCenter.findFirst({
			where: { id, organizationId: this.orgId }
		});
		if (!costCenter) throw new Error('Centro de custo não encontrado');
		return costCenter;
	}

	async updateCostCenter(id: string, data: any) {
		const costCenter = await prisma.costCenter.findFirst({
			where: { id, organizationId: this.orgId }
		});
		if (!costCenter) throw new Error('Centro de custo não encontrado');

		return prisma.costCenter.update({
			where: { id },
			data
		});
	}

	async deleteCostCenter(id: string) {
		const costCenter = await prisma.costCenter.findFirst({
			where: { id, organizationId: this.orgId }
		});
		if (!costCenter) throw new Error('Centro de custo não encontrado');

		return prisma.costCenter.update({
			where: { id },
			data: { isActive: false }
		});
	}
}

export const costCenterService = new CostCenterService();
