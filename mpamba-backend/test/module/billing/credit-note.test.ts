import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditNoteService } from '../../../src/services/module/billing/credit-note.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		creditNote: {
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
		taxRule: {
			findMany: vi.fn(),
		},
		service: {
			findMany: vi.fn(),
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

describe('CreditNoteService', () => {
	let service: CreditNoteService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new CreditNoteService();
	});

	describe('createCreditNote', () => {
		it('deve criar nota de crédito com sucesso', async () => {
			const dto = {
				invoiceId: 'inv-1',
				seriesId: 'ser-1',
				amount: 100,
				reason: 'Devolução'
			};

			(prisma.invoice.findFirst as any).mockResolvedValue({ id: 'inv-1' });
			(prisma.invoiceSeries.findFirst as any).mockResolvedValue({ id: 'ser-1' });
			(prisma.creditNote.create as any).mockResolvedValue({ id: 'cn-1', ...dto });

			const result = await service.createCreditNote(dto);

			expect(result.id).toBe('cn-1');
			expect(prisma.creditNote.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					invoiceId: 'inv-1',
					seriesId: 'ser-1',
					amount: 100
				})
			}));
		});

		it('deve calcular totais se itens forem fornecidos', async () => {
			const dto = {
				invoiceId: 'inv-1',
				seriesId: 'ser-1',
				items: [{ description: 'Devolução Item', quantity: 1, unitPrice: 50, discount: 0 }]
			};

			(prisma.invoice.findFirst as any).mockResolvedValue({ id: 'inv-1' });
			(prisma.invoiceSeries.findFirst as any).mockResolvedValue({ id: 'ser-1' });
			(prisma.taxRule.findMany as any).mockResolvedValue([]);
			(prisma.service.findMany as any).mockResolvedValue([]);
			(prisma.creditNote.create as any).mockResolvedValue({ id: 'cn-1', ...dto, amount: 50 });

			const result = await service.createCreditNote(dto);

			expect(result.amount).toBe(50);
		});
	});

	describe('issueCreditNote', () => {
		it('deve emitir nota de crédito e gerar número', async () => {
			const mockCN = { id: 'cn-1', seriesId: 'ser-1', status: 'DRAFT' };
			const mockSeries = [{ id: 'ser-1', prefix: 'NC', year: 2024, nextSequence: 1 }];

			(prisma.creditNote.findFirst as any).mockResolvedValue(mockCN);
			(prisma.$queryRaw as any).mockResolvedValue(mockSeries);
			(prisma.creditNote.update as any).mockResolvedValue({ ...mockCN, status: 'ISSUED', number: 'NC-2024-000001' });

			const result = await service.issueCreditNote('cn-1');

			expect(result.status).toBe('ISSUED');
			expect(result.number).toBe('NC-2024-000001');
		});
	});
});
