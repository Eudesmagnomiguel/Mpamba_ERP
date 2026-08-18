import { prisma } from '../../config/prisma.config.js';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export class DashboardStatsService {
	static async getStats() {
		const now = new Date();

		const [totalOrganizations, activeOrganizations, activeUsers, activeSubscriptions, monthlyGrowth, planDistribution, moduleAdoption, subscriptionStatusBreakdown] = await Promise.all([
			prisma.organization.count(),
			prisma.subscription.count({ where: { status: 'ACTIVE' } }),
			prisma.user.count({ where: { isActive: true } }),
			prisma.subscription.findMany({
				where: { status: 'ACTIVE' },
				include: { plan: { select: { price: true } } }
			}),
			this.getMonthlyGrowth(now),
			this.getPlanDistribution(),
			this.getModuleAdoption(),
			this.getSubscriptionStatusBreakdown()
		]);

		const mrr = activeSubscriptions.reduce((sum, sub) => sum + (sub.plan?.price || 0), 0);
		const conversionRate = totalOrganizations > 0 ? (activeOrganizations / totalOrganizations) * 100 : 0;

		return {
			totals: {
				organizations: totalOrganizations,
				activeUsers,
				mrr,
				conversionRate: Math.round(conversionRate * 10) / 10
			},
			monthlyGrowth,
			planDistribution,
			moduleAdoption,
			subscriptionStatusBreakdown
		};
	}

	private static async getModuleAdoption() {
		const modules = await prisma.module.findMany({ select: { id: true, code: true, name: true } });
		const counts = await Promise.all(
			modules.map((m) => prisma.organizationModule.count({ where: { moduleId: m.id, isActive: true } }))
		);
		return modules.map((m, i) => ({ code: m.code, name: m.name, organizations: counts[i] ?? 0 }));
	}

	private static async getSubscriptionStatusBreakdown() {
		const grouped = await prisma.subscription.groupBy({ by: ['status'], _count: { _all: true } });
		return grouped.map((g) => ({ status: g.status, count: g._count._all }));
	}

	private static async getMonthlyGrowth(referenceDate: Date) {
		const months: { start: Date; end: Date; name: string }[] = [];
		for (let i = 5; i >= 0; i--) {
			const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
			const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i + 1, 1);
			months.push({ start, end, name: MONTH_LABELS[start.getMonth()] ?? '' });
		}

		const counts = await Promise.all(
			months.map(({ start, end }) =>
				Promise.all([
					prisma.organization.count({ where: { createdAt: { gte: start, lt: end } } }),
					prisma.user.count({ where: { createdAt: { gte: start, lt: end } } })
				])
			)
		);

		return months.map((month, i) => ({
			name: month.name,
			newOrganizations: counts[i]?.[0] || 0,
			newUsers: counts[i]?.[1] || 0
		}));
	}

	private static async getPlanDistribution() {
		const grouped = await prisma.organization.groupBy({
			by: ['planId'],
			_count: { _all: true },
			where: { planId: { not: null } }
		});

		const planIds = grouped.map(g => g.planId).filter((id): id is string => !!id);
		const plans = await prisma.plan.findMany({
			where: { id: { in: planIds } },
			select: { id: true, name: true, price: true }
		});
		const planMap = new Map(plans.map(p => [p.id, p]));

		return grouped
			.filter(g => g.planId && planMap.has(g.planId))
			.map(g => {
				const plan = planMap.get(g.planId as string)!;
				return {
					planId: plan.id,
					planName: plan.name,
					price: plan.price,
					count: g._count._all
				};
			});
	}
}

export const dashboardStatsService = new DashboardStatsService();
