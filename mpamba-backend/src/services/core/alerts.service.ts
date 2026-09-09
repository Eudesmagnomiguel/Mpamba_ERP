import { prisma } from '../../config/prisma.config.js';
import { NotificationService } from './notification.service.js';
import { daysUntilExpiry, expiryDateBounds } from '../module/stock/expiry.constants.js';

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
		try {
			await this.checkExpiringProducts();
		} catch (error) {
			console.error('[AlertsService] Falha ao verificar validade dos produtos:', error);
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

	/**
	 * Avisa sobre produtos com stock que expiram dentro da janela de aviso, ou
	 * que já expiraram. Produtos sem validade e sem stock ficam de fora.
	 *
	 * `expiryAlertedAt` garante um aviso por validade: o alerta corre todos os
	 * dias, e sem isto repetiria a mesma notificação até o produto sair do stock.
	 * O ProductService limpa o campo quando a validade é alterada.
	 */
	private static async checkExpiringProducts() {
		const now = new Date();
		const { warningUntil } = expiryDateBounds(now);

		const products = await prisma.product.findMany({
			where: {
				isActive: true,
				currentQuantity: { gt: 0 },
				expiryDate: { not: null, lte: warningUntil },
				expiryAlertedAt: null,
			},
		});

		for (const product of products) {
			await prisma.product.update({
				where: { id: product.id },
				data: { expiryAlertedAt: now },
			});

			const days = daysUntilExpiry(product.expiryDate!, now);
			const when =
				days < 0
					? `expirou há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`
					: days === 0
						? 'expira hoje'
						: `expira em ${days} ${days === 1 ? 'dia' : 'dias'}`;

			await NotificationService.notifyOrganization(product.organizationId, {
				title: days < 0 ? 'Produto expirado' : 'Validade a terminar',
				message: `O produto "${product.name}" (${product.sku}) ${when} e tem ${product.currentQuantity} ${product.unit} em stock.`,
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
