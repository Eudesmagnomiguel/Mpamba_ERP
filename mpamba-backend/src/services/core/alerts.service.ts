import { prisma } from '../../config/prisma.config.js';
import { NotificationService } from './notification.service.js';

export class AlertsService {
	static async runChecks() {
		try {
			await this.checkOverdueInvoices();
		} catch (error) {
			console.error('[AlertsService] Falha ao verificar faturas vencidas:', error);
		}
		try {
			await this.checkCriticalTreasuryBalances();
		} catch (error) {
			console.error('[AlertsService] Falha ao verificar saldos críticos:', error);
		}
	}

	private static async checkOverdueInvoices() {
		const now = new Date();

		const overdue = await prisma.invoice.findMany({
			where: {
				status: 'ISSUED',
				paymentStatus: { in: ['PENDENTE', 'PARCIAL'] },
				dueDate: { lt: now },
				overdueAlertedAt: null,
			},
		});

		for (const invoice of overdue) {
			await prisma.invoice.update({
				where: { id: invoice.id },
				data: { paymentStatus: 'VENCIDO', overdueAlertedAt: now },
			});

			await NotificationService.notifyOrganization(invoice.organizationId, {
				title: 'Fatura vencida',
				message: `A fatura ${invoice.number || invoice.id} no valor de ${invoice.total.toLocaleString()} ${invoice.currency} está vencida.`,
				type: 'WARNING',
			});
		}
	}

	private static async checkCriticalTreasuryBalances() {
		const now = new Date();

		const critical = await prisma.financialAccount.findMany({
			where: {
				isActive: true,
				allowNegative: false,
				currentBalance: { lt: 0 },
				criticalBalanceAlertedAt: null,
			},
		});

		for (const account of critical) {
			await prisma.financialAccount.update({
				where: { id: account.id },
				data: { criticalBalanceAlertedAt: now },
			});

			await NotificationService.notifyOrganization(account.organizationId, {
				title: 'Saldo crítico',
				message: `A conta "${account.name}" está com saldo negativo (${account.currentBalance.toLocaleString()} ${account.currency}).`,
				type: 'WARNING',
			});
		}

		// Limpa o alerta quando o saldo recupera, para poder alertar de novo numa futura queda
		await prisma.financialAccount.updateMany({
			where: { criticalBalanceAlertedAt: { not: null }, currentBalance: { gte: 0 } },
			data: { criticalBalanceAlertedAt: null },
		});
	}
}
