import { prisma } from '../../../config/prisma.config.js';
import { BaseTreasuryService } from './base.service.js';

export class ReceivableService extends BaseTreasuryService {
	async createReceivable(data: { description: string; amount: number; dueDate: string | Date; customerId?: string; invoiceId?: string; categoryId?: string; costCenterId?: string; notes?: string }) {
		return prisma.receivable.create({
			data: {
				...data,
				dueDate: new Date(data.dueDate),
				organizationId: this.orgId,
				status: 'PENDENTE' as any,
			},
			include: { customer: true, category: true, costCenter: true }
		});
	}

	async getReceivables(status?: any) {
		const orgId = this.orgIdOrNull;
		if (!orgId) return [];

		return prisma.receivable.findMany({
			where: {
				organizationId: orgId,
				...(status ? { status } : {})
			},
			include: { customer: true, category: true, costCenter: true },
			orderBy: { dueDate: 'asc' }
		});
	}

	async markAsPaid(id: string) {
		const receivable = await prisma.receivable.findFirst({
			where: { id, organizationId: this.orgId }
		});
		if (!receivable) throw new Error('Conta a receber não encontrada');

		return prisma.receivable.update({
			where: { id },
			data: { status: 'PAGO' as any }
		});
	}

	async deleteReceivable(id: string) {
		const receivable = await prisma.receivable.findFirst({
			where: { id, organizationId: this.orgId }
		});
		if (!receivable) throw new Error('Conta a receber não encontrada');

		return prisma.receivable.delete({
			where: { id }
		});
	}
}

export const receivableService = new ReceivableService();
