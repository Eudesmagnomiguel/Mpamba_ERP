import { prisma } from '../../../config/prisma.config.js';
import { v4 as uuidv4 } from 'uuid';
import type { AddMovementDto, TransferDto } from '../../../shared/dto/treasury.dto.js';
import { BaseTreasuryService } from './base.service.js';
import { accountService } from './account.service.js';

export class MovementService extends BaseTreasuryService {
	async addIncome(data: AddMovementDto) {
		return prisma.$transaction(async (tx) => {
			// 1. Validar categoria
			const category = await tx.financialCategory.findFirst({
				where: { id: data.categoryId, organizationId: this.orgId }
			});

			if (!category || category.type !== 'ENTRADA') {
				throw new Error('Categoria inválida para entrada financeira');
			}

			// 2. Lock na conta para atualização segura
			await accountService.getAccountWithLock(tx, data.accountId);

			// 3. Criar movimento
			const movement = await tx.financialMovement.create({
				data: {
					...data,
					type: 'ENTRADA',
					organizationId: this.orgId,
					userId: this.userId,
				}
			});

			// 4. Atualizar saldo
			await tx.financialAccount.update({
				where: { id: data.accountId },
				data: { currentBalance: { increment: data.amount } }
			});

			return movement;
		});
	}

	async addExpense(data: AddMovementDto) {
		return prisma.$transaction(async (tx) => {
			// 1. Validar categoria
			const category = await tx.financialCategory.findFirst({
				where: { id: data.categoryId, organizationId: this.orgId }
			});

			if (!category || category.type !== 'SAIDA') {
				throw new Error('Categoria inválida para saída financeira');
			}

			// 2. Lock na conta e validação de saldo REAL pós-lock
			const account = await accountService.getAccountWithLock(tx, data.accountId);

			if (!account.allowNegative && account.currentBalance < data.amount) {
				throw new Error(`Saldo insuficiente. Disponível: ${account.currentBalance} ${account.currency}`);
			}

			// 3. Criar movimento
			const movement = await tx.financialMovement.create({
				data: {
					...data,
					type: 'SAIDA',
					organizationId: this.orgId,
					userId: this.userId,
				}
			});

			// 4. Atualizar saldo
			await tx.financialAccount.update({
				where: { id: data.accountId },
				data: { currentBalance: { decrement: data.amount } }
			});

			return movement;
		});
	}

	async transfer(data: TransferDto) {
		if (data.fromAccountId === data.toAccountId) {
			throw new Error('As contas de origem e destino devem ser diferentes');
		}

		return prisma.$transaction(async (tx) => {
			// 1. Lock em AMBAS as contas (Ordem consistente para evitar deadlocks)
			const sortedIds = [data.fromAccountId, data.toAccountId].sort();
			const id1 = sortedIds[0] as string;
			const id2 = sortedIds[1] as string;
			
			await accountService.getAccountWithLock(tx, id1);
			await accountService.getAccountWithLock(tx, id2);

			const fromAccount = await tx.financialAccount.findUnique({ where: { id: data.fromAccountId } });
			const toAccount = await tx.financialAccount.findUnique({ where: { id: data.toAccountId } });

			if (!fromAccount || !toAccount) throw new Error('Contas não encontradas');
			if (fromAccount.currency !== toAccount.currency) {
				throw new Error('Transferências exigem que ambas as contas tenham a mesma moeda');
			}

			if (!fromAccount.allowNegative && fromAccount.currentBalance < data.amount) {
				throw new Error(`Saldo insuficiente na conta de origem (${fromAccount.name})`);
			}

			const transferId = uuidv4();
			const userId = this.userId;
			const orgId = this.orgId;

			// 2. Registrar Movimentos
			const exit = await tx.financialMovement.create({
				data: {
					accountId: data.fromAccountId,
					type: 'TRANSFERENCIA',
					amount: data.amount,
					description: data.description || `Transferência para ${toAccount.name}`,
					transferId,
					userId,
					organizationId: orgId,
				}
			});

			const entry = await tx.financialMovement.create({
				data: {
					accountId: data.toAccountId,
					type: 'TRANSFERENCIA',
					amount: data.amount,
					description: data.description || `Transferência de ${fromAccount.name}`,
					transferId,
					userId,
					organizationId: orgId,
				}
			});

			// 3. Atualizar Saldos
			await tx.financialAccount.update({
				where: { id: data.fromAccountId },
				data: { currentBalance: { decrement: data.amount } }
			});

			await tx.financialAccount.update({
				where: { id: data.toAccountId },
				data: { currentBalance: { increment: data.amount } }
			});

			return { exit, entry };
		});
	}

	async getMovements(filters: { 
		accountId?: string, 
		type?: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA',
		startDate?: Date,
		endDate?: Date,
		page?: number,
		pageSize?: number
	}) {
		const { accountId, type, startDate, endDate, page = 1, pageSize = 20 } = filters;

		const orgId = this.orgIdOrNull;
		if (!orgId) return { items: [], total: 0, page, pageSize };

		const where = {
			organizationId: orgId,
			...(accountId ? { accountId } : {}),
			...(type ? { type } : {}),
			...(startDate || endDate ? {
				date: {
					...(startDate ? { gte: startDate } : {}),
					...(endDate ? { lte: endDate } : {}),
				}
			} : {})
		};

		const [total, items] = await Promise.all([
			prisma.financialMovement.count({ where }),
			prisma.financialMovement.findMany({
				where,
				include: { 
					account: { select: { name: true, type: true, currency: true } },
					category: { select: { name: true } },
					user: { select: { name: true } }
				},
				orderBy: { date: 'desc' },
				skip: (page - 1) * pageSize,
				take: pageSize
			})
		]);

		return { items, total, page, pageSize };
	}

	/**
	 * 🔍 Verificação de Integridade (Audit)
	 * Compara o saldo armazenado com a soma real dos movimentos.
	 */
	async verifyIntegrity(accountId: string) {
		const account = await prisma.financialAccount.findUnique({ where: { id: accountId } });
		if (!account) throw new Error('Conta não encontrada');

		const aggregations = await prisma.financialMovement.groupBy({
			by: ['type'],
			where: { accountId },
			_sum: { amount: true }
		});

		let calculatedBalance = 0;
		aggregations.forEach(agg => {
			if (agg.type === 'ENTRADA') calculatedBalance += (agg._sum.amount || 0);
			if (agg.type === 'SAIDA') calculatedBalance -= (agg._sum.amount || 0);
		});

		return {
			storedBalance: account.currentBalance,
			calculatedBalance,
			isConsistent: account.currentBalance === calculatedBalance
		};
	}
}

export const movementService = new MovementService();
