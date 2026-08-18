import { prisma } from '../../../config/prisma.config.js';
import { BaseBillingService } from './base.service.js';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export class StatsService extends BaseBillingService {
	async getStats() {
		const orgId = this.orgId;
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const [totalInvoiced, pendingPayments, totalCustomers, overdueInvoices, monthlyRevenue] = await Promise.all([
			// Total Faturado no Mês
			prisma.invoice.aggregate({
				where: {
					organizationId: orgId,
					status: 'ISSUED',
					date: { gte: startOfMonth }
				},
				_sum: { total: true }
			}),
			// A Receber (Pendente + Parcial)
			prisma.invoice.aggregate({
				where: {
					organizationId: orgId,
					status: 'ISSUED',
					paymentStatus: { in: ['PENDENTE', 'PARCIAL'] }
				},
				_sum: { total: true }
			}),
			// Clientes Ativos
			prisma.customer.count({
				where: { organizationId: orgId, isActive: true }
			}),
			// Faturas Vencidas
			prisma.invoice.count({
				where: {
					organizationId: orgId,
					status: 'ISSUED',
					paymentStatus: 'VENCIDO'
				}
			}),
			// Receita dos últimos 6 meses (para o gráfico de desempenho)
			this.getMonthlyRevenue(orgId, now)
		]);

		return {
			totalInvoiced: totalInvoiced._sum.total || 0,
			pendingPayments: pendingPayments._sum.total || 0,
			totalCustomers: totalCustomers,
			overdueInvoices: overdueInvoices,
			monthlyRevenue
		};
	}

	private async getMonthlyRevenue(orgId: string, referenceDate: Date) {
		const months: { start: Date; end: Date; name: string }[] = [];
		for (let i = 5; i >= 0; i--) {
			const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
			const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i + 1, 1);
			months.push({ start, end, name: MONTH_LABELS[start.getMonth()] ?? '' });
		}

		const totals = await Promise.all(
			months.map(({ start, end }) =>
				prisma.invoice.aggregate({
					where: {
						organizationId: orgId,
						status: 'ISSUED',
						date: { gte: start, lt: end }
					},
					_sum: { total: true }
				})
			)
		);

		return months.map((month, i) => ({
			name: month.name,
			value: totals[i]?._sum.total || 0
		}));
	}
}

export const statsService = new StatsService();
