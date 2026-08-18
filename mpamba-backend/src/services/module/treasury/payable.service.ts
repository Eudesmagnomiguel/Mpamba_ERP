import { prisma } from '../../../config/prisma.config.js';
import { BaseTreasuryService } from './base.service.js';

export class PayableService extends BaseTreasuryService {
	async createPayable(data: { description: string; amount: number; dueDate: string | Date; supplierId?: string; categoryId?: string; costCenterId?: string; notes?: string }) {
		return prisma.payable.create({
			data: {
				...data,
				dueDate: new Date(data.dueDate),
				organizationId: this.orgId,
				status: 'PENDENTE' as any,
			},
			include: { supplier: true, category: true, costCenter: true }
		});
	}

	async getPayables(status?: any) {
		const orgId = this.orgIdOrNull;
		if (!orgId) return [];

		return prisma.payable.findMany({
			where: {
				organizationId: orgId,
				...(status ? { status } : {})
			},
			include: { supplier: true, category: true, costCenter: true },
			orderBy: { dueDate: 'asc' }
		});
	}

	async markAsPaid(id: string) {
		const payable = await prisma.payable.findFirst({
			where: { id, organizationId: this.orgId }
		});
		if (!payable) throw new Error('Conta a pagar não encontrada');

		return prisma.payable.update({
			where: { id },
			data: { status: 'PAGO' as any }
		});
	}

	async deletePayable(id: string) {
		const payable = await prisma.payable.findFirst({
			where: { id, organizationId: this.orgId }
		});
		if (!payable) throw new Error('Conta a pagar não encontrada');

		return prisma.payable.delete({
			where: { id }
		});
	}
}

export const payableService = new PayableService();
