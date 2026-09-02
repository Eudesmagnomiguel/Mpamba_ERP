import { prisma } from '../../../config/prisma.config.js';
import { v4 as uuidv4 } from 'uuid';
import type { AddMovementDto, CreateMovementDto, TransferDto } from '../../../shared/dto/treasury.dto.js';
import { BaseTreasuryService } from './base.service.js';
import { accountService } from './account.service.js';

/** Relações devolvidas ao frontend para que a linha da tabela fique completa. */
const movementInclude = {
	account: { select: { id: true, name: true, type: true, currency: true } },
	category: { select: { id: true, name: true } },
	user: { select: { id: true, name: true } },
} as const;

export class MovementService extends BaseTreasuryService {
	/**
	 * Valida que a categoria (opcional) pertence à organização e é do tipo certo.
	 */
	private async assertCategory(tx: any, categoryId: string | null | undefined, type: 'ENTRADA' | 'SAIDA') {
		if (!categoryId) return;

		const category = await tx.financialCategory.findFirst({
			where: { id: categoryId, organizationId: this.orgId }
		});

		if (!category) {
			throw new Error('Categoria não encontrada');
		}

		if (category.type !== type) {
			throw new Error(
				type === 'ENTRADA'
					? 'A categoria selecionada não é uma categoria de entrada'
					: 'A categoria selecionada não é uma categoria de saída'
			);
		}
	}

	private buildMovementData(data: AddMovementDto, type: 'ENTRADA' | 'SAIDA') {
		return {
			accountId: data.accountId,
			type,
			amount: data.amount,
			description: data.description,
			reference: data.reference ?? null,
			categoryId: data.categoryId ?? null,
			...(data.date ? { date: data.date } : {}),
			organizationId: this.orgId,
			userId: this.userId,
		};
	}

	/**
	 * Ponto de entrada único usado por `POST /treasury/movements`.
	 */
	async createMovement(data: CreateMovementDto) {
		const { type, ...movement } = data;
		return type === 'ENTRADA' ? this.addIncome(movement) : this.addExpense(movement);
	}

	async addIncome(data: AddMovementDto) {
		return prisma.$transaction(async (tx) => {
			// 1. Validar categoria (opcional)
			await this.assertCategory(tx, data.categoryId, 'ENTRADA');

			// 2. Lock na conta para atualização segura
			await accountService.getAccountWithLock(tx, data.accountId);

			// 3. Criar movimento
			const movement = await tx.financialMovement.create({
				data: this.buildMovementData(data, 'ENTRADA'),
				include: movementInclude,
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
			// 1. Validar categoria (opcional)
			await this.assertCategory(tx, data.categoryId, 'SAIDA');

			// 2. Lock na conta e validação de saldo REAL pós-lock
			const account = await accountService.getAccountWithLock(tx, data.accountId);

			if (!account.allowNegative && account.currentBalance < data.amount) {
				throw new Error(`Saldo insuficiente. Disponível: ${account.currentBalance} ${account.currency}`);
			}

			// 3. Criar movimento
			const movement = await tx.financialMovement.create({
				data: this.buildMovementData(data, 'SAIDA'),
				include: movementInclude,
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
		if (data.originAccountId === data.destinationAccountId) {
			throw new Error('As contas de origem e destino devem ser diferentes');
		}

		return prisma.$transaction(async (tx) => {
			// 1. Lock em AMBAS as contas (Ordem consistente para evitar deadlocks)
			const sortedIds = [data.originAccountId, data.destinationAccountId].sort();
			const id1 = sortedIds[0] as string;
			const id2 = sortedIds[1] as string;

			await accountService.getAccountWithLock(tx, id1);
			await accountService.getAccountWithLock(tx, id2);

			const fromAccount = await tx.financialAccount.findFirst({
				where: { id: data.originAccountId, organizationId: this.orgId }
			});
			const toAccount = await tx.financialAccount.findFirst({
				where: { id: data.destinationAccountId, organizationId: this.orgId }
			});

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
			const date = data.date;

			// 2. Registrar Movimentos
			const exit = await tx.financialMovement.create({
				data: {
					accountId: data.originAccountId,
					type: 'TRANSFERENCIA',
					amount: data.amount,
					description: data.description || `Transferência para ${toAccount.name}`,
					reference: data.reference ?? null,
					...(date ? { date } : {}),
					transferId,
					userId,
					organizationId: orgId,
				},
				include: movementInclude,
			});

			const entry = await tx.financialMovement.create({
				data: {
					accountId: data.destinationAccountId,
					type: 'TRANSFERENCIA',
					amount: data.amount,
					description: data.description || `Transferência de ${fromAccount.name}`,
					reference: data.reference ?? null,
					...(date ? { date } : {}),
					transferId,
					userId,
					organizationId: orgId,
				},
				include: movementInclude,
			});

			// 3. Atualizar Saldos
			await tx.financialAccount.update({
				where: { id: data.originAccountId },
				data: { currentBalance: { decrement: data.amount } }
			});

			await tx.financialAccount.update({
				where: { id: data.destinationAccountId },
				data: { currentBalance: { increment: data.amount } }
			});

			return [exit, entry];
		});
	}

	async getMovements(filters: {
		accountId?: string,
		type?: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA',
		categoryId?: string,
		startDate?: Date,
		endDate?: Date,
		page?: number,
		pageSize?: number
	}) {
		const { accountId, type, categoryId, startDate, endDate, page = 1, pageSize = 20 } = filters;

		const orgId = this.orgIdOrNull;
		if (!orgId) return { items: [], total: 0, page, pageSize };

		const where = {
			organizationId: orgId,
			...(accountId ? { accountId } : {}),
			...(type ? { type } : {}),
			...(categoryId ? { categoryId } : {}),
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
				include: movementInclude,
				orderBy: { date: 'desc' },
				skip: (page - 1) * pageSize,
				take: pageSize
			})
		]);

		return { items, total, page, pageSize };
	}

	async getMovementById(movementId: string) {
		const movement = await prisma.financialMovement.findFirst({
			where: { id: movementId, organizationId: this.orgId },
			include: movementInclude,
		});

		if (!movement) throw new Error('Movimento não encontrado');
		return movement;
	}

	/**
	 * Elimina um movimento e reverte o saldo da conta.
	 *
	 * Transferências não são elimináveis por aqui: as duas pernas são gravadas
	 * com o mesmo tipo (TRANSFERENCIA), pelo que não é possível saber com
	 * segurança qual delas saiu e qual entrou. Devem ser anuladas com uma
	 * transferência em sentido contrário.
	 */
	async deleteMovement(movementId: string) {
		return prisma.$transaction(async (tx) => {
			const movement = await tx.financialMovement.findFirst({
				where: { id: movementId, organizationId: this.orgId }
			});

			if (!movement) throw new Error('Movimento não encontrado');

			if (movement.type === 'TRANSFERENCIA' || movement.transferId) {
				throw new Error('Transferências não podem ser eliminadas. Registe uma transferência em sentido contrário para as anular.');
			}

			if (movement.isReconciled) {
				throw new Error('Não é possível eliminar um movimento já reconciliado com o extrato bancário');
			}

			await accountService.getAccountWithLock(tx, movement.accountId);

			await tx.financialMovement.delete({ where: { id: movement.id } });

			await tx.financialAccount.update({
				where: { id: movement.accountId },
				data: movement.type === 'ENTRADA'
					? { currentBalance: { decrement: movement.amount } }
					: { currentBalance: { increment: movement.amount } }
			});

			return { id: movement.id };
		});
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
