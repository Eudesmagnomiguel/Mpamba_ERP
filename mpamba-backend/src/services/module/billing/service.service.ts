import { prisma } from '../../../config/prisma.config.js';
import type { CreateServiceDto, UpdateServiceDto } from '../../../shared/dto/billing.dto.js';
import { BaseBillingService } from './base.service.js';

export class CatalogService extends BaseBillingService {
	async createService(data: CreateServiceDto) {
		const orgId = this.orgId;
		return prisma.service.create({
			data: {
				...data,
				organizationId: orgId,
			},
		});
	}

	async updateService(id: string, data: UpdateServiceDto) {
		const orgId = this.orgId;
		return prisma.service.update({
			where: { id, organizationId: orgId },
			data,
		});
	}

	async listServices(params?: { search?: string }) {
		const orgId = this.orgId;
		return prisma.service.findMany({
			where: {
				organizationId: orgId,
				isActive: true,
				...(params?.search ? {
					OR: [
						{ name: { contains: params.search, mode: 'insensitive' } },
						{ description: { contains: params.search, mode: 'insensitive' } },
					]
				} : {})
			},
			orderBy: { name: 'asc' },
		});
	}

	async getServiceById(id: string) {
		const orgId = this.orgId;
		const service = await prisma.service.findFirst({
			where: { id, organizationId: orgId },
		});
		if (!service) throw new Error('Serviço não encontrado');
		return service;
	}

	async deleteService(id: string) {
		const orgId = this.orgId;
		return prisma.service.update({
			where: { id, organizationId: orgId },
			data: { isActive: false },
		});
	}
}

export const catalogService = new CatalogService();
