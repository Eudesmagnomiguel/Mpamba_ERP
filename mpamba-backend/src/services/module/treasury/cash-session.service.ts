import { prisma } from '../../../config/prisma.config.js';
import { BaseTreasuryService } from './base.service.js';
import type { OpenCashSessionDto, CloseCashSessionDto } from '../../../shared/dto/treasury.dto.js';

export class CashSessionService extends BaseTreasuryService {
	async openSession(data: OpenCashSessionDto) {
		const orgId = this.orgId;
		const userId = this.userId;

		const account = await prisma.financialAccount.findFirst({
			where: { id: data.financialAccountId, organizationId: orgId },
		});
		if (!account) throw new Error('Conta não encontrada');
		if (!account.isActive) throw new Error('Conta está desativada');

		const existingOpen = await prisma.cashSession.findFirst({
			where: { financialAccountId: data.financialAccountId, status: 'OPEN' },
		});
		if (existingOpen) throw new Error('Já existe uma sessão de caixa aberta para esta conta');

		return prisma.cashSession.create({
			data: {
				organizationId: orgId,
				financialAccountId: data.financialAccountId,
				openedById: userId,
				openingBalance: data.openingBalance,
				notes: data.notes,
				status: 'OPEN',
			},
			include: { financialAccount: true, openedBy: { select: { id: true, name: true } } },
		});
	}

	async closeSession(sessionId: string, data: CloseCashSessionDto) {
		const orgId = this.orgId;
		const userId = this.userId;

		const session = await prisma.cashSession.findFirst({
			where: { id: sessionId, organizationId: orgId },
			include: { financialAccount: true },
		});
		if (!session) throw new Error('Sessão de caixa não encontrada');
		if (session.status !== 'OPEN') throw new Error('Esta sessão de caixa já foi fechada');

		const expectedClosingBalance = session.financialAccount.currentBalance;
		const difference = data.actualClosingBalance - expectedClosingBalance;

		return prisma.cashSession.update({
			where: { id: sessionId },
			data: {
				status: 'CLOSED',
				closedById: userId,
				closedAt: new Date(),
				expectedClosingBalance,
				actualClosingBalance: data.actualClosingBalance,
				difference,
				notes: data.notes ?? session.notes,
			},
			include: { financialAccount: true, openedBy: { select: { id: true, name: true } }, closedBy: { select: { id: true, name: true } } },
		});
	}

	async getActiveSession(financialAccountId: string) {
		const orgId = this.orgId;
		return prisma.cashSession.findFirst({
			where: { financialAccountId, organizationId: orgId, status: 'OPEN' },
			include: { financialAccount: true, openedBy: { select: { id: true, name: true } } },
		});
	}

	async listSessions(params?: { financialAccountId?: string; status?: 'OPEN' | 'CLOSED'; page?: number; pageSize?: number }) {
		const page = params?.page || 1;
		const pageSize = params?.pageSize || 20;
		const skip = (page - 1) * pageSize;

		const orgId = this.orgIdOrNull;
		if (!orgId) {
			return { data: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
		}

		const where: any = { organizationId: orgId };
		if (params?.financialAccountId) where.financialAccountId = params.financialAccountId;
		if (params?.status) where.status = params.status;

		const [data, total] = await Promise.all([
			prisma.cashSession.findMany({
				where,
				include: {
					financialAccount: { select: { id: true, name: true, type: true, currency: true } },
					openedBy: { select: { id: true, name: true } },
					closedBy: { select: { id: true, name: true } },
				},
				orderBy: { openedAt: 'desc' },
				skip,
				take: pageSize,
			}),
			prisma.cashSession.count({ where }),
		]);

		return {
			data,
			pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
		};
	}
}

export const cashSessionService = new CashSessionService();
