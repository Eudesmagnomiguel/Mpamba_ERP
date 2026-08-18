import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceService } from '../../../src/services/module/billing/invoice.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		invoice: {
			findMany: vi.fn(),
			count: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
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
		$transaction: vi.fn((cb) => cb(prisma)),
		$queryRaw: vi.fn(),
		invoiceSeries: {
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

describe('InvoiceService', () => {
	let service: InvoiceService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new InvoiceService();
	});

	describe('listInvoices', () => {
		it('deve listar faturas da organização com paginação', async () => {
			const mockInvoices = [{ id: 'inv-1', number: 'FT-2024-000001' }];
			(prisma.invoice.findMany as any).mockResolvedValue(mockInvoices);
			(prisma.invoice.count as any).mockResolvedValue(1);

			const result = await service.listInvoices();

			expect(result.data).toEqual(mockInvoices);
			expect(result.meta.total).toBe(1);
			expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({ organizationId: 'org-1' })
			}));
		});

		it('deve filtrar faturas por status', async () => {
			(prisma.invoice.findMany as any).mockResolvedValue([]);
			(prisma.invoice.count as any).mockResolvedValue(0);

			await service.listInvoices({ status: 'ISSUED' });

			expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({ status: 'ISSUED' })
			}));
		});
	});

	describe('createInvoice', () => {
		it('deve criar fatura com totais calculados', async () => {
			const dto = {
				customerId: 'cust-1',
				items: [{
					description: 'Serviço de Teste',
					quantity: 2,
					unitPrice: 100,
					discount: 10
				}]
			};

			(prisma.customer.findFirst as any).mockResolvedValue({ id: 'cust-1', category: 'NORMAL' });
			(prisma.service.findMany as any).mockResolvedValue([]);
			(prisma.taxRule.findMany as any).mockResolvedValue([]);
			(prisma.invoice.create as any).mockResolvedValue({ id: 'inv-new', ...dto });

			const result = await service.createInvoice(dto as any);

			expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					subtotal: 200,
					discountTotal: 10,
					taxTotal: 0,
					total: 190,
					organizationId: 'org-1',
					status: 'DRAFT'
				})
			}));
		});
	});

	describe('getInvoiceById', () => {
		it('deve retornar fatura por id', async () => {
			const mockInvoice = { id: 'inv-1', organizationId: 'org-1' };
			(prisma.invoice.findFirst as any).mockResolvedValue(mockInvoice);

			const result = await service.getInvoiceById('inv-1');
			expect(result).toEqual(mockInvoice);
		});

		it('deve lançar erro se fatura não existir', async () => {
			(prisma.invoice.findFirst as any).mockResolvedValue(null);

			await expect(service.getInvoiceById('inv-invalid')).rejects.toThrow('Fatura não encontrada');
		});
	});

	describe('issueInvoice', () => {
		it('deve emitir fatura e gerar número', async () => {
			const mockInvoice = {
				id: 'inv-1',
				status: 'DRAFT',
				seriesId: 'ser-1',
				items: [{ description: 'Item 1', quantity: 1, unitPrice: 100, discount: 0 }]
			};
			const mockSeries = [{ id: 'ser-1', prefix: 'FT', year: 2024, nextSequence: 1 }];

			(prisma.invoice.findFirst as any).mockResolvedValue(mockInvoice);
			(prisma.customer.findFirst as any).mockResolvedValue(null);
			(prisma.service.findMany as any).mockResolvedValue([]);
			(prisma.taxRule.findMany as any).mockResolvedValue([]);
			(prisma.$queryRaw as any).mockResolvedValue(mockSeries);
			(prisma.invoice.update as any).mockResolvedValue({ ...mockInvoice, status: 'ISSUED', number: 'FT-2024-000001' });

			const result = await service.issueInvoice('inv-1');

			expect(result.status).toBe('ISSUED');
			expect(result.number).toBe('FT-2024-000001');
			expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({ status: 'ISSUED' })
			}));
		});

		it('deve lançar erro se fatura já estiver emitida', async () => {
			(prisma.invoice.findFirst as any).mockResolvedValue({ id: 'inv-1', status: 'ISSUED' });

			await expect(service.issueInvoice('inv-1')).rejects.toThrow('fatura já está no estado ISSUED');
		});
	});

	describe('cancelInvoice', () => {
		it('deve cancelar fatura emitida', async () => {
			const mockInvoice = { id: 'inv-1', status: 'ISSUED' };
			(prisma.invoice.findFirst as any).mockResolvedValue(mockInvoice);
			(prisma.invoice.update as any).mockResolvedValue({ ...mockInvoice, status: 'CANCELLED' });

			const result = await service.cancelInvoice('inv-1', { reason: 'Erro no preenchimento' });

			expect(result.status).toBe('CANCELLED');
			expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({ status: 'CANCELLED', cancelReason: 'Erro no preenchimento' })
			}));
		});

		it('não deve cancelar fatura rascunho', async () => {
			(prisma.invoice.findFirst as any).mockResolvedValue({ id: 'inv-1', status: 'DRAFT' });

			await expect(service.cancelInvoice('inv-1', { reason: 'Teste' })).rejects.toThrow('Apenas faturas emitidas (ISSUED) podem ser canceladas');
		});
	});
});
