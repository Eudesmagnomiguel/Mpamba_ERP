import { prisma } from '../../../config/prisma.config.js';
import { BaseTreasuryService } from './base.service.js';

const COLORS = ['#6366f1','#10b981','#f43f5e','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

export class ReportService extends BaseTreasuryService {
	/**
	 * 📊 Relatório de Fluxo de Caixa (Entradas vs Saídas)
	 */
	async getCashFlowReport(startDate: Date, endDate: Date) {
		const movements = await prisma.financialMovement.groupBy({
			by: ['type'],
			where: {
				organizationId: this.orgId,
				date: { gte: startDate, lte: endDate }
			},
			_sum: { amount: true },
			_count: { id: true }
		});

		const income = movements.find(m => m.type === 'ENTRADA')?._sum.amount || 0;
		const expense = movements.find(m => m.type === 'SAIDA')?._sum.amount || 0;

		return {
			period: { startDate, endDate },
			income,
			expense,
			netFlow: income - expense,
			transactionCount: movements.reduce((acc, curr) => acc + curr._count.id, 0)
		};
	}

	/**
	 * 📈 Relatório por Categoria
	 */
	async getCategoryReport(type: 'ENTRADA' | 'SAIDA', startDate: Date, endDate: Date) {
		const report = await prisma.financialMovement.groupBy({
			by: ['categoryId'],
			where: {
				organizationId: this.orgId,
				type,
				date: { gte: startDate, lte: endDate }
			},
			_sum: { amount: true },
			_count: { id: true }
		});

		// Enriquecer com nomes das categorias
		const enrichedReport = await Promise.all(report.map(async (item) => {
			const category = item.categoryId 
				? await prisma.financialCategory.findUnique({ where: { id: item.categoryId } })
				: { name: 'Sem Categoria' };
			
			return {
				category: category?.name,
				total: item._sum.amount || 0,
				count: item._count.id
			};
		}));

		return enrichedReport.sort((a, b) => b.total - a.total);
	}

	/**
	 * 📋 Resumo geral para o Dashboard (KPIs + Gráficos + Contas)
	 */
	async getSummary(params?: { startDate?: string; endDate?: string }) {
		// Super Admins não têm organizationId — não há tesouraria própria para mostrar,
		// então devolve um resumo vazio em vez de rebentar com "Contexto obrigatório".
		const orgId = this.orgIdOrNull;
		if (!orgId) {
			return {
				totalBalance: 0,
				totalIncomes: 0,
				totalExpenses: 0,
				evolutionData: [],
				categoryData: [],
				accountsBalance: [],
			};
		}

		const now = new Date();

		// Período padrão: últimos 30 dias se não especificado
		const endDate = params?.endDate ? new Date(params.endDate) : now;
		const startDate = params?.startDate
			? new Date(params.startDate)
			: new Date(new Date().setDate(now.getDate() - 30));

		// ── KPIs: saldo total, receitas, despesas ──────────────────────────────
		const [accounts, movementAgg] = await Promise.all([
			prisma.financialAccount.findMany({
				where: { organizationId: orgId, isActive: true },
				select: { id: true, name: true, type: true, currentBalance: true, currency: true }
			}),
			prisma.financialMovement.groupBy({
				by: ['type'],
				where: {
					organizationId: orgId,
					date: { gte: startDate, lte: endDate }
				},
				_sum: { amount: true }
			})
		]);

		const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
		const totalIncomes = movementAgg.find(m => m.type === 'ENTRADA')?._sum.amount ?? 0;
		const totalExpenses = movementAgg.find(m => m.type === 'SAIDA')?._sum.amount ?? 0;

		// ── Evolução dos últimos 6 meses ──────────────────────────────────────
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
		sixMonthsAgo.setDate(1);

		const evolutionMovements = await prisma.financialMovement.findMany({
			where: {
				organizationId: orgId,
				date: { gte: sixMonthsAgo },
				type: { in: ['ENTRADA', 'SAIDA'] }
			},
			select: { date: true, amount: true, type: true }
		});

		// Agrupar por mês
		const monthMap: Record<string, { incomes: number; expenses: number }> = {};
		evolutionMovements.forEach(m => {
			const key = new Date(m.date).toLocaleDateString('pt-AO', { month: 'short', year: '2-digit' });
			if (!monthMap[key]) monthMap[key] = { incomes: 0, expenses: 0 };
			if (m.type === 'ENTRADA') monthMap[key].incomes += m.amount;
			else monthMap[key].expenses += m.amount;
		});
		const evolutionData = Object.entries(monthMap).map(([date, v]) => ({ date, ...v }));

		// ── Distribuição por Categoria (Despesas) ─────────────────────────────
		const categoryAgg = await prisma.financialMovement.groupBy({
			by: ['categoryId'],
			where: {
				organizationId: orgId,
				type: 'SAIDA',
				date: { gte: startDate, lte: endDate }
			},
			_sum: { amount: true }
		});

		const totalExpForPct = categoryAgg.reduce((s, c) => s + (c._sum.amount ?? 0), 0);

		const categoryData = await Promise.all(
			categoryAgg.map(async (item, i) => {
				const cat = item.categoryId
					? await prisma.financialCategory.findUnique({ where: { id: item.categoryId }, select: { name: true } })
					: null;
				return {
					name: cat?.name ?? 'Sem Categoria',
					value: totalExpForPct > 0 ? Math.round(((item._sum.amount ?? 0) / totalExpForPct) * 100) : 0,
					color: COLORS[i % COLORS.length]
				};
			})
		);

		return {
			totalBalance,
			totalIncomes,
			totalExpenses,
			evolutionData,
			categoryData,
			accountsBalance: accounts.map(a => ({ id: a.id, name: a.name, type: a.type, balance: a.currentBalance, currency: a.currency })),
		};
	}
}

export const reportService = new ReportService();
