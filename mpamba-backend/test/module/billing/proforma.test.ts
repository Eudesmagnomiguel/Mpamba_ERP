import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProformaService } from '../../../src/services/module/billing/proforma.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';
import { invoiceService } from '../../../src/services/module/billing/invoice.service.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		proforma: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		proformaItem: {
			deleteMany: vi.fn(),
		},
		customer: {
			findFirst: vi.fn(),
		},
		service: {
			findMany: vi.fn(),
		},
		taxRule: {
			findMany: vi.fn(),
		},
		invoiceSeries: {
			findFirst: vi.fn(),
			update: vi.fn(),
		},
		$transaction: vi.fn((cb) => cb(prisma)),
		$queryRaw: vi.fn(),
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

vi.mock('../../../src/services/module/billing/invoice.service.js', () => ({
	invoiceService: {
		createInvoice: vi.fn(),
	},
}));

describe('ProformaService', () => {
	let service: ProformaService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new ProformaService();
	});

	describe('createProforma', () => {
		it('deve criar proforma com sucesso', async () => {
			const dto = {
				seriesId: 'ser-1',
				items: [{ description: 'Teste', quantity: 1, unitPrice: 100, discount: 0 }]
			};
			const mockSeries = { id: 'ser-1', prefix: 'PP', year: 2024, nextSequence: 1 };

			(prisma.invoiceSeries.findFirst as any).mockResolvedValue(mockSeries);
			(prisma.$queryRaw as any).mockResolvedValue([mockSeries]);
			(prisma.customer.findFirst as any).mockResolvedValue(null);
			(prisma.service.findMany as any).mockResolvedValue([]);
			(prisma.taxRule.findMany as any).mockResolvedValue([]);
			(prisma.proforma.create as any).mockResolvedValue({ id: 'prof-1', ...dto });

			const result = await service.createProforma(dto);

			expect(result.id).toBe('prof-1');
			expect(prisma.proforma.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					organizationId: 'org-1',
					total: 100
				})
			}));
		});
	});

	describe('convertProformaToInvoice', () => {
		it('deve converter proforma em fatura', async () => {
			const mockProforma = {
				id: 'prof-1',
				customerId: 'cust-1',
				items: [{ serviceId: 's1', description: 'T', quantity: 1, unitPrice: 100, taxRate: 0, discount: 0 }]
			};
			(prisma.proforma.findFirst as any).mockResolvedValue(mockProforma);
			(prisma.invoiceSeries.findFirst as any).mockResolvedValue({ id: 'ser-ft', prefix: 'FT' });
			(invoiceService.createInvoice as any).mockResolvedValue({ id: 'inv-1' });

			const result = await service.convertProformaToInvoice('prof-1');

			expect(result.id).toBe('inv-1');
			expect(invoiceService.createInvoice).toHaveBeenCalled();
			expect(prisma.proforma.update).toHaveBeenCalledWith({
				where: { id: 'prof-1' },
				data: { invoiceId: 'inv-1', status: 'CONVERTED' }
			});
		});

		it('não deve converter proforma já convertida', async () => {
			(prisma.proforma.findFirst as any).mockResolvedValue({ id: 'prof-1', invoiceId: 'inv-already' });

			await expect(service.convertProformaToInvoice('prof-1')).rejects.toThrow('Esta proforma já foi convertida em fatura');
		});
	});
});
