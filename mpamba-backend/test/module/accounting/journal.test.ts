import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JournalService } from '../../../src/services/module/accounting/journal.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { createManualEntrySchema } from '../../../src/shared/dto/accounting.dto.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		$transaction: vi.fn(),
		journalEntry: { count: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
		accountingAccount: { findMany: vi.fn() },
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

const account = (overrides: Record<string, unknown> = {}) => ({
	id: 'acc-1',
	code: '45.1',
	name: 'Fundo fixo',
	isActive: true,
	...overrides,
});

/** Duas linhas balanceadas sobre as contas 45.1 (débito) e 61.3 (crédito). */
const balancedLines = [
	{ accountId: 'acc-1', debit: 1000, credit: 0 },
	{ accountId: 'acc-2', debit: 0, credit: 1000 },
];

/** Contas válidas para `balancedLines`, sem sub-contas. */
const mockValidAccounts = () => {
	(prisma.accountingAccount.findMany as any)
		.mockResolvedValueOnce([account(), account({ id: 'acc-2', code: '61.3', name: 'Mercadorias' })])
		.mockResolvedValueOnce([]);
};

describe('JournalService.createManualEntry', () => {
	let service: JournalService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new JournalService();
		(prisma.$transaction as any).mockImplementation(async (fn: any) =>
			fn({ journalEntry: { count: vi.fn().mockResolvedValue(0), create: vi.fn().mockResolvedValue({ id: 'entry-1' }) } })
		);
	});

	it('registra um lançamento balanceado com contas válidas', async () => {
		mockValidAccounts();

		const entry = await service.createManualEntry({ description: 'Venda a pronto', lines: balancedLines });

		expect(entry).toEqual({ id: 'entry-1' });
	});

	it('recusa um lançamento com menos de duas linhas', async () => {
		await expect(
			service.createManualEntry({ description: 'Teste', lines: [{ accountId: 'acc-1', debit: 1000 }] })
		).rejects.toThrow(/pelo menos duas linhas/);
	});

	it('recusa uma linha com débito e crédito em simultâneo', async () => {
		await expect(
			service.createManualEntry({
				description: 'Teste',
				lines: [
					{ accountId: 'acc-1', debit: 500, credit: 500 },
					{ accountId: 'acc-2', debit: 0, credit: 500 },
				],
			})
		).rejects.toThrow(/débito e crédito em simultâneo/);
	});

	it('recusa um lançamento não balanceado', async () => {
		await expect(
			service.createManualEntry({
				description: 'Teste',
				lines: [
					{ accountId: 'acc-1', debit: 1000, credit: 0 },
					{ accountId: 'acc-2', debit: 0, credit: 900 },
				],
			})
		).rejects.toThrow(/não está balanceado/);
	});

	it('recusa uma data futura', async () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		await expect(
			service.createManualEntry({ description: 'Teste', date: tomorrow, lines: balancedLines })
		).rejects.toThrow(/não pode ser futura/);
	});

	it('aceita a data de hoje', async () => {
		mockValidAccounts();

		await expect(
			service.createManualEntry({ description: 'Teste', date: new Date(), lines: balancedLines })
		).resolves.toEqual({ id: 'entry-1' });
	});

	it('recusa contas que não pertencem à organização', async () => {
		// Só uma das duas contas pedidas volta da consulta com o filtro de organização
		(prisma.accountingAccount.findMany as any).mockResolvedValueOnce([account()]);

		await expect(
			service.createManualEntry({ description: 'Teste', lines: balancedLines })
		).rejects.toThrow(/não existem no plano de contas desta organização/);
	});

	it('recusa contas desativadas', async () => {
		(prisma.accountingAccount.findMany as any).mockResolvedValueOnce([
			account(),
			account({ id: 'acc-2', code: '61.3', name: 'Mercadorias', isActive: false }),
		]);

		await expect(
			service.createManualEntry({ description: 'Teste', lines: balancedLines })
		).rejects.toThrow(/contas desativadas: 61.3 — Mercadorias/);
	});

	it('recusa contas que agregam sub-contas', async () => {
		(prisma.accountingAccount.findMany as any)
			.mockResolvedValueOnce([account({ id: 'acc-1', code: '34', name: 'Estado' }), account({ id: 'acc-2', code: '61.3' })])
			.mockResolvedValueOnce([{ parentId: 'acc-1' }]);

		await expect(
			service.createManualEntry({ description: 'Teste', lines: balancedLines })
		).rejects.toThrow(/agregam sub-contas.*34 — Estado/);
	});
});

describe('createManualEntrySchema', () => {
	it('trata a data vazia do formulário como «sem data»', () => {
		const result = createManualEntrySchema.safeParse({
			description: 'Venda a pronto',
			date: '',
			lines: [
				{ accountId: '11111111-1111-4111-8111-111111111111', debit: 1000, credit: 0 },
				{ accountId: '22222222-2222-4222-8222-222222222222', debit: 0, credit: 1000 },
			],
		});

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.date).toBeUndefined();
	});

	it('converte uma data preenchida', () => {
		const result = createManualEntrySchema.safeParse({
			description: 'Venda a pronto',
			date: '2026-09-01',
			lines: [
				{ accountId: '11111111-1111-4111-8111-111111111111', debit: 1000, credit: 0 },
				{ accountId: '22222222-2222-4222-8222-222222222222', debit: 0, credit: 1000 },
			],
		});

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.date).toBeInstanceOf(Date);
	});
});
