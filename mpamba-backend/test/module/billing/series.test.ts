import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeriesService } from '../../../src/services/module/billing/series.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		invoiceSeries: {
			create: vi.fn(),
			findMany: vi.fn(),
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

describe('SeriesService', () => {
	let service: SeriesService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new SeriesService();
	});

	describe('createSeries', () => {
		it('deve criar série com organizationId', async () => {
			const dto = { prefix: 'FT', year: 2024 };
			(prisma.invoiceSeries.create as any).mockResolvedValue({ id: 'ser-1', ...dto });

			const result = await service.createSeries(dto);

			expect(result.id).toBe('ser-1');
			expect(prisma.invoiceSeries.create).toHaveBeenCalledWith({
				data: { ...dto, organizationId: 'org-1' }
			});
		});
	});

	describe('getSeries', () => {
		it('deve listar séries activas da organização', async () => {
			const mockSeries = [{ id: 'ser-1', prefix: 'FT', isActive: true }];
			(prisma.invoiceSeries.findMany as any).mockResolvedValue(mockSeries);

			const result = await service.getSeries();

			expect(result).toEqual(mockSeries);
			expect(prisma.invoiceSeries.findMany).toHaveBeenCalledWith({
				where: { organizationId: 'org-1', isActive: true }
			});
		});
	});
});
