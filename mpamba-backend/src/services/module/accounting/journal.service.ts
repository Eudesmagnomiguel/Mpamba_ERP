import { prisma } from '../../../config/prisma.config.js';
import { BaseAccountingService } from './base.service.js';

export interface JournalEntryLineInput {
	accountId: string;
	debit?: number;
	credit?: number;
	description?: string;
}

export interface CreateJournalEntryInput {
	date?: Date;
	description: string;
	lines: JournalEntryLineInput[];
}

export class JournalService extends BaseAccountingService {
	private async generateNumber(organizationId: string, tx: any = prisma) {
		const year = new Date().getFullYear();
		const count = await tx.journalEntry.count({ where: { organizationId } });
		return `LC-${year}-${String(count + 1).padStart(6, '0')}`;
	}

	private validateLines(lines: JournalEntryLineInput[]) {
		if (!lines || lines.length < 2) {
			throw new Error('Um lançamento contabilístico precisa de pelo menos duas linhas (débito e crédito)');
		}

		let totalDebit = 0;
		let totalCredit = 0;

		for (const line of lines) {
			const debit = line.debit || 0;
			const credit = line.credit || 0;

			if (debit > 0 && credit > 0) {
				throw new Error('Uma linha não pode ter débito e crédito em simultâneo');
			}
			if (debit === 0 && credit === 0) {
				throw new Error('Cada linha precisa de um valor de débito ou de crédito');
			}

			totalDebit += debit;
			totalCredit += credit;
		}

		const diff = Math.round((totalDebit - totalCredit) * 100) / 100;
		if (diff !== 0) {
			throw new Error(`O lançamento não está balanceado: débito ${totalDebit.toFixed(2)} ≠ crédito ${totalCredit.toFixed(2)}`);
		}

		return { totalDebit, totalCredit };
	}

	async createManualEntry(data: CreateJournalEntryInput) {
		const orgId = this.orgId;
		const userId = this.userId;

		this.validateLines(data.lines);

		return prisma.$transaction(async (tx) => {
			const number = await this.generateNumber(orgId, tx);

			return tx.journalEntry.create({
				data: {
					number,
					date: data.date ?? new Date(),
					description: data.description,
					source: 'MANUAL',
					organizationId: orgId,
					userId,
					lines: {
						create: data.lines.map((l) => ({
							accountId: l.accountId,
							debit: l.debit || 0,
							credit: l.credit || 0,
							description: l.description,
						})),
					},
				},
				include: { lines: { include: { account: true } } },
			});
		});
	}

	async listEntries(params?: { page?: number; pageSize?: number; startDate?: Date; endDate?: Date }) {
		const orgId = this.orgId;
		const page = params?.page || 1;
		const pageSize = params?.pageSize || 20;
		const skip = (page - 1) * pageSize;

		const where: any = { organizationId: orgId };
		if (params?.startDate || params?.endDate) {
			where.date = {};
			if (params.startDate) where.date.gte = params.startDate;
			if (params.endDate) where.date.lte = params.endDate;
		}

		const [data, total] = await Promise.all([
			prisma.journalEntry.findMany({
				where,
				include: { lines: { include: { account: true } }, user: { select: { id: true, name: true } } },
				orderBy: { date: 'desc' },
				skip,
				take: pageSize,
			}),
			prisma.journalEntry.count({ where }),
		]);

		return {
			data,
			pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
		};
	}

	async getEntryById(id: string) {
		const orgId = this.orgId;
		const entry = await prisma.journalEntry.findFirst({
			where: { id, organizationId: orgId },
			include: { lines: { include: { account: true } }, user: { select: { id: true, name: true } } },
		});
		if (!entry) throw new Error('Lançamento não encontrado');
		return entry;
	}

	/**
	 * Reverte um lançamento existente, criando uma nova entrada com débito/crédito invertidos
	 * (nunca apaga o lançamento original, mantendo o rasto de auditoria).
	 */
	async reverseEntry(id: string, reason?: string) {
		const orgId = this.orgId;
		const userId = this.userId;

		const original = await prisma.journalEntry.findFirst({
			where: { id, organizationId: orgId },
			include: { lines: true },
		});
		if (!original) throw new Error('Lançamento não encontrado');
		if (original.reversedById) throw new Error('Este lançamento já foi revertido');

		return prisma.$transaction(async (tx) => {
			const number = await this.generateNumber(orgId, tx);

			const reversal = await tx.journalEntry.create({
				data: {
					number,
					date: new Date(),
					description: reason ? `Reversão: ${original.description} (${reason})` : `Reversão: ${original.description}`,
					source: original.source,
					sourceReference: original.sourceReference ? `REVERSAL:${original.sourceReference}` : null,
					organizationId: orgId,
					userId,
					lines: {
						create: original.lines.map((l) => ({
							accountId: l.accountId,
							debit: l.credit,
							credit: l.debit,
							description: l.description,
						})),
					},
				},
				include: { lines: true },
			});

			await tx.journalEntry.update({ where: { id: original.id }, data: { reversedById: reversal.id } });

			return reversal;
		});
	}
}

export const journalService = new JournalService();
