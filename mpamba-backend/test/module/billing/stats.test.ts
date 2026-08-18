import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatsService } from '../../../src/services/module/billing/stats.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		invoice: {
			aggregate: vi.fn(),
			count: vi.fn(),
		},
		customer: {
			count: vi.fn(),
		},
	},
}));

vi.mock('../../../src/shared/utils/organization.context.js', () => ({
	organizationContext: {
		getOrganizationId: vi.fn().mockReturnValue('org-1'),
		getUserId: vi.fn().mockReturnValue('user-1'),
		isSuperAdmin: vi.fn().mockReturnValue(false),
		getStore: vi.fn(),
	},
}));

describe('StatsService', () => {
	let service: StatsService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new StatsService();
	});

	describe('getStats', () => {
		it('deve retornar estatísticas da organização', async () => {
			(prisma.invoice.aggregate as any).mockResolvedValueOnce({ _sum: { total: 1000 } });
			(prisma.invoice.aggregate as any).mockResolvedValueOnce({ _sum: { total: 500 } });
			(prisma.invoice.aggregate as any).mockResolvedValue({ _sum: { total: 0 } });
			(prisma.customer.count as any).mockResolvedValue(10);
			(prisma.invoice.count as any).mockResolvedValue(2);

			const result = await service.getStats();

			expect(result.totalInvoiced).toBe(1000);
			expect(result.pendingPayments).toBe(500);
			expect(result.totalCustomers).toBe(10);
			expect(result.overdueInvoices).toBe(2);
			expect(result.monthlyRevenue).toHaveLength(6);
			result.monthlyRevenue.forEach((month: any) => {
				expect(typeof month.name).toBe('string');
				expect(typeof month.value).toBe('number');
			});
			// 2 agregações principais + 6 meses de receita
			expect(prisma.invoice.aggregate).toHaveBeenCalledTimes(8);
		});

		it('deve retornar zeros se não houver dados', async () => {
			(prisma.invoice.aggregate as any).mockResolvedValue({ _sum: { total: null } });
			(prisma.customer.count as any).mockResolvedValue(0);
			(prisma.invoice.count as any).mockResolvedValue(0);

			const result = await service.getStats();

			expect(result.totalInvoiced).toBe(0);
			expect(result.pendingPayments).toBe(0);
			expect(result.monthlyRevenue.every((m: any) => m.value === 0)).toBe(true);
		});
	});
});
