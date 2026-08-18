import { prisma } from '../../../config/prisma.config.js';
import { BaseBillingService } from './base.service.js';

export class SeriesService extends BaseBillingService {
	async createSeries(data: { prefix: string; year: number }) {
		const orgId = this.orgId;
		return prisma.invoiceSeries.create({
			data: {
				...data,
				organizationId: orgId,
			},
		});
	}

	async getSeries() {
		return prisma.invoiceSeries.findMany({
			where: { organizationId: this.orgId, isActive: true },
		});
	}
}

export const seriesService = new SeriesService();
