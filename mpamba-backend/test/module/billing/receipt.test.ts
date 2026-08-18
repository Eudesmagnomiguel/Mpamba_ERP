import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiptService } from '../../../src/services/module/billing/receipt.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		receipt: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		invoice: {
			findFirst: vi.fn(),
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

describe('ReceiptService', () => {
	let service: ReceiptService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new ReceiptService();
	});

	describe('createReceipt', () => {
		it('deve criar recibo com sucesso', async () => {
			const dto = {
				invoiceId: 'inv-1',
				seriesId: 'ser-1',
				amount: 100,
				paymentMethod: 'CASH'
			};

			(prisma.invoice.findFirst as any).mockResolvedValue({ id: 'inv-1' });
			(prisma.invoiceSeries.findFirst as any).mockResolvedValue({ id: 'ser-1' });
			(prisma.receipt.create as any).mockResolvedValue({ id: 'rec-1', ...dto });

			const result = await service.createReceipt(dto);

			expect(result.id).toBe('rec-1');
			expect(prisma.receipt.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					invoiceId: 'inv-1',
					seriesId: 'ser-1',
					organizationId: 'org-1'
				})
			}));
		});

		it('deve lançar erro se fatura não existir', async () => {
			(prisma.invoice.findFirst as any).mockResolvedValue(null);

			await expect(service.createReceipt({ invoiceId: 'invalid' })).rejects.toThrow('Fatura não encontrada');
		});
	});

	describe('issueReceipt', () => {
		it('deve emitir recibo e gerar número', async () => {
			const mockReceipt = { id: 'rec-1', seriesId: 'ser-1', status: 'DRAFT' };
			const mockSeries = [{ id: 'ser-1', prefix: 'RC', year: 2024, nextSequence: 1 }];

			(prisma.receipt.findFirst as any).mockResolvedValue(mockReceipt);
			(prisma.$queryRaw as any).mockResolvedValue(mockSeries);
			(prisma.receipt.update as any).mockResolvedValue({ ...mockReceipt, status: 'ISSUED', number: 'RC-2024-000001' });

			const result = await service.issueReceipt('rec-1');

			expect(result.status).toBe('ISSUED');
			expect(result.number).toBe('RC-2024-000001');
		});

		it('não deve emitir recibo já emitido', async () => {
			(prisma.receipt.findFirst as any).mockResolvedValue({ id: 'rec-1', status: 'ISSUED' });

			await expect(service.issueReceipt('rec-1')).rejects.toThrow('Este recibo já foi emitido');
		});
	});

	describe('listReceipts', () => {
		it('deve listar recibos da organização', async () => {
			const mockReceipts = [
				{ id: 'rec-1', organizationId: 'org-1', invoiceId: 'inv-1' }
			];
			(prisma.receipt.findMany as any).mockResolvedValue(mockReceipts);

			const result = await service.listReceipts();

			expect(result).toHaveLength(1);
			expect(prisma.receipt.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({ organizationId: 'org-1' })
			}));
		});

		it('deve filtrar por termo de pesquisa', async () => {
			(prisma.receipt.findMany as any).mockResolvedValue([]);

			await service.listReceipts({ search: 'RC-001' });

			expect(prisma.receipt.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({
					OR: [
						{ number: { contains: 'RC-001', mode: 'insensitive' } },
						{ reference: { contains: 'RC-001', mode: 'insensitive' } },
					]
				})
			}));
		});
	});
});
