import { prisma } from '../../../config/prisma.config.js';
import { BaseAccountingService } from './base.service.js';
import { DEFAULT_ACCOUNTS, ANCHOR_ACCOUNT_CODES, type AccountSide } from './default-accounts.constants.js';

export class AccountingAccountService extends BaseAccountingService {
	/**
	 * Semeia o plano de contas por defeito para a organização, de forma preguiçosa (lazy)
	 * e idempotente — só cria se a organização ainda não tiver nenhuma conta.
	 */
	async ensureDefaultAccounts(orgId: string) {
		const count = await prisma.accountingAccount.count({ where: { organizationId: orgId } });
		if (count > 0) return;

		const codeToId = new Map<string, string>();
		for (const template of DEFAULT_ACCOUNTS) {
			const parentId = template.parentCode ? codeToId.get(template.parentCode) ?? null : null;
			const created = await prisma.accountingAccount.create({
				data: {
					code: template.code,
					name: template.name,
					class: template.class,
					side: template.side,
					organizationId: orgId,
					parentId,
				},
			});
			codeToId.set(template.code, created.id);
		}
	}

	async listAccounts() {
		const orgId = this.orgId;
		await this.ensureDefaultAccounts(orgId);

		return prisma.accountingAccount.findMany({
			where: { organizationId: orgId },
			orderBy: { code: 'asc' },
		});
	}

	async getAccountById(id: string) {
		const orgId = this.orgId;
		const account = await prisma.accountingAccount.findFirst({ where: { id, organizationId: orgId } });
		if (!account) throw new Error('Conta contabilística não encontrada');
		return account;
	}

	async createAccount(data: { code: string; name: string; class: number; side: AccountSide; parentId?: string | null }) {
		const orgId = this.orgId;
		return prisma.accountingAccount.create({
			data: {
				code: data.code,
				name: data.name,
				class: data.class,
				side: data.side,
				parentId: data.parentId ?? null,
				organizationId: orgId,
			},
		});
	}

	async updateAccount(id: string, data: { name?: string; isActive?: boolean }) {
		const orgId = this.orgId;
		const account = await prisma.accountingAccount.findFirst({ where: { id, organizationId: orgId } });
		if (!account) throw new Error('Conta contabilística não encontrada');

		return prisma.accountingAccount.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.isActive !== undefined && { isActive: data.isActive }),
			},
		});
	}

	async deleteAccount(id: string) {
		const orgId = this.orgId;
		const account = await prisma.accountingAccount.findFirst({ where: { id, organizationId: orgId } });
		if (!account) throw new Error('Conta contabilística não encontrada');

		if (Object.values(ANCHOR_ACCOUNT_CODES).includes(account.code as any)) {
			throw new Error('Esta conta é usada pelos lançamentos automáticos e não pode ser eliminada');
		}

		const linesCount = await prisma.journalEntryLine.count({ where: { accountId: id } });
		if (linesCount > 0) {
			throw new Error('Esta conta já tem lançamentos associados e não pode ser eliminada');
		}

		await prisma.accountingAccount.delete({ where: { id } });
	}
}

export const accountingAccountService = new AccountingAccountService();
