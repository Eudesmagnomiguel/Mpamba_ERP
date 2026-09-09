import { prisma } from '../../../config/prisma.config.js';
import { ANCHOR_ACCOUNT_CODES } from './default-accounts.constants.js';
import { accountingAccountService } from './account.service.js';

/**
 * Lançamentos automáticos de contabilidade, disparados pelo IntegrationService
 * a partir dos eventos já existentes de faturação. Todos idempotentes
 * (verificam sourceReference antes de criar) e nunca lançam exceções para
 * o chamador — falhas são apenas registadas em log, sem bloquear o fluxo principal.
 */
export class AccountingPostingService {
	private async getAccountId(organizationId: string, code: string): Promise<string | null> {
		const account = await prisma.accountingAccount.findFirst({ where: { organizationId, code } });
		return account?.id ?? null;
	}

	/**
	 * Garante o plano de contas antes de resolver as contas-âncora. É chamado uma
	 * vez por lançamento, e não dentro de `getAccountId`: as âncoras são
	 * resolvidas em paralelo, e semear a partir de cada uma repetiria a
	 * sincronização e punha várias a semear ao mesmo tempo.
	 */
	private async ensurePlan(organizationId: string) {
		await accountingAccountService.ensureDefaultAccounts(organizationId);
	}

	private async alreadyPosted(organizationId: string, sourceReference: string): Promise<boolean> {
		const existing = await prisma.journalEntry.findFirst({ where: { organizationId, sourceReference } });
		return !!existing;
	}

	private async generateNumber(organizationId: string): Promise<string> {
		const year = new Date().getFullYear();
		const count = await prisma.journalEntry.count({ where: { organizationId } });
		return `LC-${year}-${String(count + 1).padStart(6, '0')}`;
	}

	async postInvoiceIssued(invoice: {
		id: string;
		number: string | null;
		organizationId: string;
		userId: string;
		subtotal: number;
		taxTotal: number;
		total: number;
		items?: { serviceId?: string | null; subtotal: number }[];
	}) {
		try {
			const sourceReference = `INV:${invoice.number}`;
			if (await this.alreadyPosted(invoice.organizationId, sourceReference)) return;

			await this.ensurePlan(invoice.organizationId);
			const [clientesId, vendasId, servicosId, ivaId] = await Promise.all([
				this.getAccountId(invoice.organizationId, ANCHOR_ACCOUNT_CODES.CLIENTES),
				this.getAccountId(invoice.organizationId, ANCHOR_ACCOUNT_CODES.VENDAS),
				this.getAccountId(invoice.organizationId, ANCHOR_ACCOUNT_CODES.PRESTACOES_SERVICOS),
				this.getAccountId(invoice.organizationId, ANCHOR_ACCOUNT_CODES.IVA_LIQUIDADO),
			]);
			if (!clientesId || !vendasId || !servicosId || !ivaId) return;

			// O PGC separa 61 Vendas (mercadorias) de 62 Prestações de serviços, por
			// isso o rédito da fatura é repartido pelas linhas que vendem serviços e
			// pelas restantes. Sem linhas na fatura, tudo vai para Vendas.
			const servicesRevenue = (invoice.items ?? [])
				.filter((item) => !!item.serviceId)
				.reduce((sum, item) => sum + item.subtotal, 0);
			const goodsRevenue = invoice.subtotal - servicesRevenue;

			const lines = [{ accountId: clientesId, debit: invoice.total, credit: 0 }];
			if (goodsRevenue > 0) lines.push({ accountId: vendasId, debit: 0, credit: goodsRevenue });
			if (servicesRevenue > 0) lines.push({ accountId: servicosId, debit: 0, credit: servicesRevenue });
			if (invoice.taxTotal > 0) lines.push({ accountId: ivaId, debit: 0, credit: invoice.taxTotal });

			const number = await this.generateNumber(invoice.organizationId);
			await prisma.journalEntry.create({
				data: {
					number,
					description: `Fatura ${invoice.number} emitida`,
					source: 'AUTOMATIC',
					sourceReference,
					organizationId: invoice.organizationId,
					userId: invoice.userId,
					lines: { create: lines },
				},
			});
		} catch (error) {
			console.error('[AccountingPostingService] Falha ao lançar fatura emitida:', error);
		}
	}

	async postReceiptIssued(receipt: { id: string; number: string | null; organizationId: string; userId: string; amount: number }, financialAccountType: 'CAIXA' | 'BANCO') {
		try {
			const sourceReference = `REC:${receipt.number}`;
			if (await this.alreadyPosted(receipt.organizationId, sourceReference)) return;

			await this.ensurePlan(receipt.organizationId);
			const cashCode = financialAccountType === 'BANCO' ? ANCHOR_ACCOUNT_CODES.BANCOS : ANCHOR_ACCOUNT_CODES.CAIXA;
			const [cashId, clientesId] = await Promise.all([
				this.getAccountId(receipt.organizationId, cashCode),
				this.getAccountId(receipt.organizationId, ANCHOR_ACCOUNT_CODES.CLIENTES),
			]);
			if (!cashId || !clientesId) return;

			const number = await this.generateNumber(receipt.organizationId);
			await prisma.journalEntry.create({
				data: {
					number,
					description: `Recibo ${receipt.number} emitido`,
					source: 'AUTOMATIC',
					sourceReference,
					organizationId: receipt.organizationId,
					userId: receipt.userId,
					lines: {
						create: [
							{ accountId: cashId, debit: receipt.amount, credit: 0 },
							{ accountId: clientesId, debit: 0, credit: receipt.amount },
						],
					},
				},
			});
		} catch (error) {
			console.error('[AccountingPostingService] Falha ao lançar recibo emitido:', error);
		}
	}

	async postCreditNoteIssued(creditNote: { id: string; number: string | null; organizationId: string; userId: string; subtotal: number; taxTotal: number }) {
		try {
			const sourceReference = `NC:${creditNote.number}`;
			if (await this.alreadyPosted(creditNote.organizationId, sourceReference)) return;

			await this.ensurePlan(creditNote.organizationId);
			const [clientesId, vendasId, ivaId] = await Promise.all([
				this.getAccountId(creditNote.organizationId, ANCHOR_ACCOUNT_CODES.CLIENTES),
				this.getAccountId(creditNote.organizationId, ANCHOR_ACCOUNT_CODES.VENDAS),
				this.getAccountId(creditNote.organizationId, ANCHOR_ACCOUNT_CODES.IVA_LIQUIDADO),
			]);
			if (!clientesId || !vendasId || !ivaId) return;

			const total = (creditNote.subtotal || 0) + (creditNote.taxTotal || 0);
			const lines = [{ accountId: clientesId, debit: 0, credit: total }];
			if (creditNote.subtotal > 0) lines.push({ accountId: vendasId, debit: creditNote.subtotal, credit: 0 });
			if (creditNote.taxTotal > 0) lines.push({ accountId: ivaId, debit: creditNote.taxTotal, credit: 0 });

			const number = await this.generateNumber(creditNote.organizationId);
			await prisma.journalEntry.create({
				data: {
					number,
					description: `Nota de crédito ${creditNote.number} emitida`,
					source: 'AUTOMATIC',
					sourceReference,
					organizationId: creditNote.organizationId,
					userId: creditNote.userId,
					lines: { create: lines },
				},
			});
		} catch (error) {
			console.error('[AccountingPostingService] Falha ao lançar nota de crédito emitida:', error);
		}
	}

	async postInvoiceCancelled(invoice: { id: string; number: string | null; organizationId: string; userId: string }) {
		try {
			const originalReference = `INV:${invoice.number}`;
			const reversalReference = `REVERSAL:${originalReference}`;
			if (await this.alreadyPosted(invoice.organizationId, reversalReference)) return;

			const original = await prisma.journalEntry.findFirst({
				where: { organizationId: invoice.organizationId, sourceReference: originalReference },
				include: { lines: true },
			});
			if (!original) return;

			const number = await this.generateNumber(invoice.organizationId);
			const reversal = await prisma.journalEntry.create({
				data: {
					number,
					description: `Anulação da fatura ${invoice.number}`,
					source: 'AUTOMATIC',
					sourceReference: reversalReference,
					organizationId: invoice.organizationId,
					userId: invoice.userId,
					lines: {
						create: original.lines.map((l) => ({
							accountId: l.accountId,
							debit: l.credit,
							credit: l.debit,
						})),
					},
				},
			});

			await prisma.journalEntry.update({ where: { id: original.id }, data: { reversedById: reversal.id } });
		} catch (error) {
			console.error('[AccountingPostingService] Falha ao reverter fatura anulada:', error);
		}
	}
}

export const accountingPostingService = new AccountingPostingService();
