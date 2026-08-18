import { prisma } from '../../../config/prisma.config.js';
import type { CreateAccountDto } from '../../../shared/dto/treasury.dto.js';
import { BaseTreasuryService } from './base.service.js';

export class AccountService extends BaseTreasuryService {
	async createAccount(data: CreateAccountDto) {
		return prisma.financialAccount.create({
			data: {
				...data,
				organizationId: this.orgId,
				currentBalance: 0,
			},
		});
	}

	async getAccounts() {
		const orgId = this.orgIdOrNull;
		if (!orgId) return [];

		return prisma.financialAccount.findMany({
			where: { organizationId: orgId, isActive: true },
			orderBy: { name: 'asc' }
		});
	}

	async getAccountById(accountId: string) {
		const account = await prisma.financialAccount.findFirst({
			where: { id: accountId, organizationId: this.orgId }
		});
		if (!account) throw new Error('Conta não encontrada');
		return account;
	}

	async updateAccount(accountId: string, data: any) {
		const account = await prisma.financialAccount.findFirst({
			where: { id: accountId, organizationId: this.orgId }
		});
		if (!account) throw new Error('Conta não encontrada');

		return prisma.financialAccount.update({
			where: { id: accountId },
			data
		});
	}

	async deleteAccount(accountId: string) {
		const account = await prisma.financialAccount.findFirst({
			where: { id: accountId, organizationId: this.orgId }
		});
		if (!account) throw new Error('Conta não encontrada');

		// Soft delete or hard delete depending on your logic, using isActive = false for safety
		return prisma.financialAccount.update({
			where: { id: accountId },
			data: { isActive: false }
		});
	}

	async getBalance(accountId: string) {
		const account = await prisma.financialAccount.findFirst({
			where: { id: accountId, organizationId: this.orgId }
		});
		if (!account) throw new Error('Conta não encontrada');
		return account.currentBalance;
	}

	/**
	 * Obtém uma conta com LOCK (FOR UPDATE) para garantir consistência
	 * em ambientes concorrentes.
	 */
	async getAccountWithLock(tx: any, accountId: string) {
		const accounts = await tx.$queryRaw`
			SELECT * FROM "FinancialAccount" 
			WHERE id = ${accountId} AND "organizationId" = ${this.orgId}
			FOR UPDATE
		`;

		if (!accounts || accounts.length === 0) {
			throw new Error('Conta financeira não encontrada ou sem acesso');
		}

		return accounts[0];
	}
}

export const accountService = new AccountService();
