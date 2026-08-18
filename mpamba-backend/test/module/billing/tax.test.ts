import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxService } from '../../../src/services/module/billing/tax.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		taxRule: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
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

describe('TaxService', () => {
	let service: TaxService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new TaxService();
	});

	describe('listTaxRules', () => {
		it('deve listar regras de imposto da organização', async () => {
			const mockRules = [{ id: 'r1', name: 'IVA', rate: 14 }];
			(prisma.taxRule.findMany as any).mockResolvedValue(mockRules);

			const result = await service.listTaxRules();

			expect(result).toEqual(mockRules);
			expect(prisma.taxRule.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: { organizationId: 'org-1' }
			}));
		});
	});

	describe('createTaxRule', () => {
		it('deve criar regra de imposto com organizationId', async () => {
			const dto = { name: 'IVA Angola', rate: 14, scope: 'GLOBAL', kind: 'ADDITIVE' };
			(prisma.taxRule.create as any).mockResolvedValue({ id: 'r1', ...dto });

			const result = await service.createTaxRule(dto as any);

			expect(result.id).toBe('r1');
			expect(prisma.taxRule.create).toHaveBeenCalledWith({
				data: { ...dto, organizationId: 'org-1', targetValue: null }
			});
		});

		it('deve definir targetValue como nulo se for GLOBAL', async () => {
			const dto = { name: 'Global Rule', scope: 'GLOBAL', targetValue: 'some-value' };
			await service.createTaxRule(dto as any);

			expect(prisma.taxRule.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({ targetValue: null })
			}));
		});
	});

	describe('deleteTaxRule', () => {
		it('deve desactivar regra de imposto', async () => {
			(prisma.taxRule.update as any).mockResolvedValue({ id: 'r1', isActive: false });

			const result = await service.deleteTaxRule('r1');

			expect(result.isActive).toBe(false);
			expect(prisma.taxRule.update).toHaveBeenCalledWith({
				where: { id: 'r1', organizationId: 'org-1' },
				data: { isActive: false }
			});
		});
	});
});
