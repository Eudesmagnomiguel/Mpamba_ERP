import { prisma } from '../../../config/prisma.config.js';
import { BaseAccountingService } from './base.service.js';
import { compareAccountCodes } from './default-accounts.constants.js';

export class AccountingReportService extends BaseAccountingService {
	/**
	 * Balancete (Trial Balance) — soma débito/crédito de cada conta no período,
	 * e o respetivo saldo.
	 */
	async getTrialBalance(params?: { startDate?: Date; endDate?: Date }) {
		const orgId = this.orgId;

		const entryWhere: any = { organizationId: orgId };
		if (params?.startDate || params?.endDate) {
			entryWhere.date = {};
			if (params.startDate) entryWhere.date.gte = params.startDate;
			if (params.endDate) entryWhere.date.lte = params.endDate;
		}

		// `ORDER BY code` é textual e poria 75.2.11 antes de 75.2.9; a ordenação
		// hierárquica dos códigos do PGC é feita em memória.
		const accounts = (await prisma.accountingAccount.findMany({
			where: { organizationId: orgId },
		})).sort((a, b) => compareAccountCodes(a.code, b.code));

		const lines = await prisma.journalEntryLine.findMany({
			where: { entry: entryWhere },
			select: { accountId: true, debit: true, credit: true },
		});

		const totalsByAccount = new Map<string, { debit: number; credit: number }>();
		for (const line of lines) {
			const current = totalsByAccount.get(line.accountId) || { debit: 0, credit: 0 };
			current.debit += line.debit;
			current.credit += line.credit;
			totalsByAccount.set(line.accountId, current);
		}

		const rows = accounts.map((account) => {
			const totals = totalsByAccount.get(account.id) || { debit: 0, credit: 0 };
			return {
				accountId: account.id,
				code: account.code,
				name: account.name,
				class: account.class,
				debit: totals.debit,
				credit: totals.credit,
				balance: totals.debit - totals.credit,
			};
		}).filter((row) => row.debit !== 0 || row.credit !== 0);

		const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
		const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);

		return {
			rows,
			totals: {
				debit: totalDebit,
				credit: totalCredit,
				balanced: Math.abs(totalDebit - totalCredit) < 0.01,
			},
		};
	}

	/**
	 * Razão (Ledger) de uma conta específica — lista cronológica de lançamentos
	 * com saldo corrente.
	 */
	async getLedgerByAccount(accountId: string, params?: { startDate?: Date; endDate?: Date }) {
		const orgId = this.orgId;

		const account = await prisma.accountingAccount.findFirst({ where: { id: accountId, organizationId: orgId } });
		if (!account) throw new Error('Conta contabilística não encontrada');

		const entryWhere: any = { organizationId: orgId };
		if (params?.startDate || params?.endDate) {
			entryWhere.date = {};
			if (params.startDate) entryWhere.date.gte = params.startDate;
			if (params.endDate) entryWhere.date.lte = params.endDate;
		}

		const lines = await prisma.journalEntryLine.findMany({
			where: { accountId, entry: entryWhere },
			include: { entry: { select: { id: true, number: true, date: true, description: true, sourceReference: true } } },
			orderBy: { entry: { date: 'asc' } },
		});

		let runningBalance = 0;
		const rows = lines.map((line) => {
			runningBalance += line.debit - line.credit;
			return {
				entryId: line.entry.id,
				number: line.entry.number,
				date: line.entry.date,
				description: line.entry.description,
				sourceReference: line.entry.sourceReference,
				debit: line.debit,
				credit: line.credit,
				balance: runningBalance,
			};
		});

		return { account, rows, closingBalance: runningBalance };
	}

	/**
	 * Demonstração de Resultados (P&L) — agrupa as contas de Custo e Proveito
	 * no período e calcula o Resultado Líquido (Proveitos - Custos).
	 */
	async getIncomeStatement(params?: { startDate?: Date; endDate?: Date }) {
		const orgId = this.orgId;

		const entryWhere: any = { organizationId: orgId };
		if (params?.startDate || params?.endDate) {
			entryWhere.date = {};
			if (params.startDate) entryWhere.date.gte = params.startDate;
			if (params.endDate) entryWhere.date.lte = params.endDate;
		}

		const accounts = (await prisma.accountingAccount.findMany({
			where: { organizationId: orgId, side: { in: ['CUSTO', 'PROVEITO'] } },
		})).sort((a, b) => compareAccountCodes(a.code, b.code));

		const lines = await prisma.journalEntryLine.findMany({
			where: { entry: entryWhere, accountId: { in: accounts.map((a) => a.id) } },
			select: { accountId: true, debit: true, credit: true },
		});

		const totalsByAccount = new Map<string, { debit: number; credit: number }>();
		for (const line of lines) {
			const current = totalsByAccount.get(line.accountId) || { debit: 0, credit: 0 };
			current.debit += line.debit;
			current.credit += line.credit;
			totalsByAccount.set(line.accountId, current);
		}

		const costs: { accountId: string; code: string; name: string; amount: number }[] = [];
		const revenues: { accountId: string; code: string; name: string; amount: number }[] = [];

		for (const account of accounts) {
			const totals = totalsByAccount.get(account.id) || { debit: 0, credit: 0 };
			if (totals.debit === 0 && totals.credit === 0) continue;

			if (account.side === 'CUSTO') {
				costs.push({ accountId: account.id, code: account.code, name: account.name, amount: totals.debit - totals.credit });
			} else {
				revenues.push({ accountId: account.id, code: account.code, name: account.name, amount: totals.credit - totals.debit });
			}
		}

		const totalCosts = costs.reduce((sum, r) => sum + r.amount, 0);
		const totalRevenues = revenues.reduce((sum, r) => sum + r.amount, 0);

		return {
			costs,
			revenues,
			totals: {
				costs: totalCosts,
				revenues: totalRevenues,
				netResult: totalRevenues - totalCosts,
			},
		};
	}

	/**
	 * Balanço — fotografia num ponto no tempo (não período) de Ativo, Passivo
	 * e Capital Próprio. Inclui o Resultado do Período (desde sempre até
	 * `asOfDate`) como linha sintética dentro do Capital Próprio, para que
	 * Ativo feche com Passivo + Capital Próprio mesmo sem um fecho de exercício formal.
	 */
	async getBalanceSheet(params: { asOfDate: Date }) {
		const orgId = this.orgId;
		const entryWhere: any = { organizationId: orgId, date: { lte: params.asOfDate } };

		const accounts = (await prisma.accountingAccount.findMany({
			where: { organizationId: orgId, side: { in: ['ATIVO', 'PASSIVO', 'CAPITAL_PROPRIO'] } },
		})).sort((a, b) => compareAccountCodes(a.code, b.code));

		const lines = await prisma.journalEntryLine.findMany({
			where: { entry: entryWhere, accountId: { in: accounts.map((a) => a.id) } },
			select: { accountId: true, debit: true, credit: true },
		});

		const totalsByAccount = new Map<string, { debit: number; credit: number }>();
		for (const line of lines) {
			const current = totalsByAccount.get(line.accountId) || { debit: 0, credit: 0 };
			current.debit += line.debit;
			current.credit += line.credit;
			totalsByAccount.set(line.accountId, current);
		}

		const assets: { accountId: string; code: string; name: string; balance: number }[] = [];
		const liabilities: { accountId: string; code: string; name: string; balance: number }[] = [];
		const equity: { accountId: string; code: string; name: string; balance: number }[] = [];

		for (const account of accounts) {
			const totals = totalsByAccount.get(account.id) || { debit: 0, credit: 0 };
			if (totals.debit === 0 && totals.credit === 0) continue;

			if (account.side === 'ATIVO') {
				assets.push({ accountId: account.id, code: account.code, name: account.name, balance: totals.debit - totals.credit });
			} else if (account.side === 'PASSIVO') {
				liabilities.push({ accountId: account.id, code: account.code, name: account.name, balance: totals.credit - totals.debit });
			} else {
				equity.push({ accountId: account.id, code: account.code, name: account.name, balance: totals.credit - totals.debit });
			}
		}

		const { totals: incomeTotals } = await this.getIncomeStatement({ endDate: params.asOfDate });
		const netResultOfPeriod = incomeTotals.netResult;
		if (netResultOfPeriod !== 0) {
			equity.push({ accountId: 'resultado-periodo', code: '—', name: 'Resultado do Período', balance: netResultOfPeriod });
		}

		const totalAssets = assets.reduce((sum, r) => sum + r.balance, 0);
		const totalLiabilities = liabilities.reduce((sum, r) => sum + r.balance, 0);
		const totalEquity = equity.reduce((sum, r) => sum + r.balance, 0);
		const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

		return {
			assets,
			liabilities,
			equity,
			netResultOfPeriod,
			totals: {
				assets: totalAssets,
				liabilitiesAndEquity: totalLiabilitiesAndEquity,
				balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
			},
		};
	}
}

export const accountingReportService = new AccountingReportService();
