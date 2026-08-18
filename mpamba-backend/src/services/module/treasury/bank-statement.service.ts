import { prisma } from '../../../config/prisma.config.js';
import { BaseTreasuryService } from './base.service.js';
import type { CreateBankStatementDto } from '../../../shared/dto/treasury.dto.js';

const MATCH_WINDOW_DAYS = 3;

export class BankStatementService extends BaseTreasuryService {
	async createStatement(data: CreateBankStatementDto) {
		const orgId = this.orgId;

		const account = await prisma.financialAccount.findFirst({ where: { id: data.accountId, organizationId: orgId } });
		if (!account) throw new Error('Conta não encontrada');

		return prisma.bankStatement.create({
			data: {
				accountId: data.accountId,
				organizationId: orgId,
				fileName: data.fileName,
				startDate: data.startDate,
				endDate: data.endDate,
				startingBalance: data.startingBalance,
				endingBalance: data.endingBalance,
				status: 'PENDING',
				lines: {
					create: data.lines.map((line) => ({
						date: line.date,
						description: line.description,
						amount: line.amount,
						type: line.type,
						reference: line.reference,
					})),
				},
			},
			include: { account: true, lines: true },
		});
	}

	async listStatements() {
		const orgId = this.orgIdOrNull;
		if (!orgId) return [];

		return prisma.bankStatement.findMany({
			where: { organizationId: orgId },
			include: { account: { select: { id: true, name: true, type: true } }, lines: { select: { id: true, isReconciled: true } } },
			orderBy: { createdAt: 'desc' },
		});
	}

	async getStatementById(id: string) {
		const orgId = this.orgId;
		const statement = await prisma.bankStatement.findFirst({
			where: { id, organizationId: orgId },
			include: {
				account: true,
				lines: { include: { movement: true }, orderBy: { date: 'asc' } },
			},
		});
		if (!statement) throw new Error('Extrato bancário não encontrado');
		return statement;
	}

	/**
	 * Tenta reconciliar automaticamente cada linha não reconciliada do extrato,
	 * procurando um único FinancialMovement na mesma conta, mesmo tipo, mesmo
	 * valor exato e dentro de uma janela de ±3 dias. Ambíguo (>1 candidato) ou
	 * sem correspondência fica para revisão manual.
	 */
	async autoMatch(statementId: string) {
		const orgId = this.orgId;
		const statement = await prisma.bankStatement.findFirst({
			where: { id: statementId, organizationId: orgId },
			include: { lines: true },
		});
		if (!statement) throw new Error('Extrato bancário não encontrado');

		let matchedCount = 0;
		for (const line of statement.lines) {
			if (line.isReconciled) continue;

			const windowStart = new Date(line.date);
			windowStart.setDate(windowStart.getDate() - MATCH_WINDOW_DAYS);
			const windowEnd = new Date(line.date);
			windowEnd.setDate(windowEnd.getDate() + MATCH_WINDOW_DAYS);

			const candidates = await prisma.financialMovement.findMany({
				where: {
					accountId: statement.accountId,
					organizationId: orgId,
					type: line.type,
					amount: line.amount,
					bankStatementLineId: null,
					date: { gte: windowStart, lte: windowEnd },
				},
			});

			if (candidates.length !== 1) continue;
			const movement = candidates[0]!;

			try {
				await prisma.$transaction([
					prisma.financialMovement.update({
						where: { id: movement.id },
						data: { isReconciled: true, bankStatementLineId: line.id },
					}),
					prisma.bankStatementLine.update({
						where: { id: line.id },
						data: { isReconciled: true },
					}),
				]);
				matchedCount++;
			} catch (error: any) {
				console.warn(`[BankStatement] Falha ao ligar automaticamente a linha ${line.id}: ${error.message}`);
			}
		}

		await this.recomputeStatus(statementId);
		return { matchedCount, totalLines: statement.lines.length };
	}

	async manualMatch(lineId: string, movementId: string) {
		const orgId = this.orgId;
		const line = await prisma.bankStatementLine.findFirst({
			where: { id: lineId, statement: { organizationId: orgId } },
			include: { statement: true },
		});
		if (!line) throw new Error('Linha do extrato não encontrada');
		if (line.isReconciled) throw new Error('Esta linha já está reconciliada');

		const movement = await prisma.financialMovement.findFirst({
			where: { id: movementId, organizationId: orgId, accountId: line.statement.accountId },
		});
		if (!movement) throw new Error('Movimento financeiro não encontrado nesta conta');
		if (movement.bankStatementLineId) throw new Error('Este movimento já está ligado a outra linha do extrato');

		await prisma.$transaction([
			prisma.financialMovement.update({
				where: { id: movement.id },
				data: { isReconciled: true, bankStatementLineId: line.id },
			}),
			prisma.bankStatementLine.update({
				where: { id: line.id },
				data: { isReconciled: true },
			}),
		]);

		await this.recomputeStatus(line.statementId);
	}

	async unmatch(lineId: string) {
		const orgId = this.orgId;
		const line = await prisma.bankStatementLine.findFirst({
			where: { id: lineId, statement: { organizationId: orgId } },
			include: { movement: true },
		});
		if (!line) throw new Error('Linha do extrato não encontrada');
		if (!line.isReconciled) throw new Error('Esta linha ainda não está reconciliada');

		await prisma.$transaction([
			prisma.bankStatementLine.update({ where: { id: line.id }, data: { isReconciled: false } }),
			...(line.movement
				? [prisma.financialMovement.update({ where: { id: line.movement.id }, data: { isReconciled: false, bankStatementLineId: null } })]
				: []),
		]);

		await this.recomputeStatus(line.statementId);
	}

	/** Candidatos de movimentos financeiros ainda não ligados a uma linha, para o dropdown de match manual. */
	async listUnmatchedMovements(statementId: string) {
		const orgId = this.orgId;
		const statement = await prisma.bankStatement.findFirst({ where: { id: statementId, organizationId: orgId } });
		if (!statement) throw new Error('Extrato bancário não encontrado');

		return prisma.financialMovement.findMany({
			where: { accountId: statement.accountId, organizationId: orgId, bankStatementLineId: null },
			orderBy: { date: 'desc' },
			take: 100,
		});
	}

	private async recomputeStatus(statementId: string) {
		const lines = await prisma.bankStatementLine.findMany({ where: { statementId }, select: { isReconciled: true } });
		const reconciledCount = lines.filter((l) => l.isReconciled).length;

		const status = reconciledCount === 0 ? 'PENDING' : reconciledCount === lines.length ? 'COMPLETED' : 'PARTIAL';
		await prisma.bankStatement.update({ where: { id: statementId }, data: { status } });
	}
}

export const bankStatementService = new BankStatementService();
