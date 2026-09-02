import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MovementService } from '../../../src/services/module/treasury/movement.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { createMovementSchema, transferSchema } from '../../../src/shared/dto/treasury.dto.js';

const tx: any = {
	financialCategory: { findFirst: vi.fn() },
	financialMovement: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
	financialAccount: { update: vi.fn(), findFirst: vi.fn() },
	$queryRaw: vi.fn(),
};

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		$transaction: vi.fn(),
		financialMovement: {
			count: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			groupBy: vi.fn(),
		},
		financialAccount: { findUnique: vi.fn() },
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
	name: 'Caixa',
	currency: 'AOA',
	currentBalance: 1000,
	allowNegative: false,
	...overrides,
});

describe('DTOs de movimentos de tesouraria', () => {
	it('aceita o payload enviado pelo formulário (sem categoria, data e referência vazias)', () => {
		const result = createMovementSchema.safeParse({
			accountId: 'acc-1',
			type: 'ENTRADA',
			amount: 5000,
			description: 'Venda a pronto',
			reference: '',
			date: '',
			categoryId: null,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.categoryId).toBeNull();
			expect(result.data.date).toBeUndefined();
			expect(result.data.reference).toBeUndefined();
		}
	});

	it('converte a data enviada como string ISO', () => {
		const result = createMovementSchema.safeParse({
			accountId: 'acc-1',
			type: 'SAIDA',
			amount: 100,
			description: 'Combustível',
			date: '2026-02-10',
		});

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.date).toBeInstanceOf(Date);
	});

	it('recusa um tipo de movimento inválido', () => {
		const result = createMovementSchema.safeParse({
			accountId: 'acc-1',
			type: 'TRANSFERENCIA',
			amount: 100,
			description: 'Teste',
		});

		expect(result.success).toBe(false);
	});

	it('aceita a transferência com os nomes do frontend e com os antigos', () => {
		const novo = transferSchema.safeParse({
			originAccountId: 'acc-1',
			destinationAccountId: 'acc-2',
			amount: 250,
			description: '',
		});
		const antigo = transferSchema.safeParse({
			fromAccountId: 'acc-1',
			toAccountId: 'acc-2',
			amount: 250,
		});

		expect(novo.success).toBe(true);
		expect(antigo.success).toBe(true);
		if (antigo.success) {
			expect(antigo.data.originAccountId).toBe('acc-1');
			expect(antigo.data.destinationAccountId).toBe('acc-2');
		}
	});
});

describe('MovementService', () => {
	let service: MovementService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new MovementService();
		(prisma.$transaction as any).mockImplementation((fn: any) => fn(tx));
		tx.$queryRaw.mockResolvedValue([account()]);
		tx.financialMovement.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'mv-1', ...data }));
	});

	it('regista uma entrada sem categoria e credita a conta', async () => {
		const movement = await service.createMovement({
			accountId: 'acc-1',
			type: 'ENTRADA',
			amount: 5000,
			description: 'Venda a pronto',
		} as any);

		expect(movement.type).toBe('ENTRADA');
		expect(movement.categoryId).toBeNull();
		expect(tx.financialCategory.findFirst).not.toHaveBeenCalled();
		expect(tx.financialAccount.update).toHaveBeenCalledWith({
			where: { id: 'acc-1' },
			data: { currentBalance: { increment: 5000 } },
		});
	});

	it('recusa uma entrada com categoria de saída', async () => {
		tx.financialCategory.findFirst.mockResolvedValue({ id: 'cat-1', type: 'SAIDA' });

		await expect(
			service.createMovement({
				accountId: 'acc-1',
				type: 'ENTRADA',
				amount: 100,
				description: 'Teste',
				categoryId: 'cat-1',
			} as any)
		).rejects.toThrow('não é uma categoria de entrada');
	});

	it('recusa uma saída sem saldo suficiente', async () => {
		tx.$queryRaw.mockResolvedValue([account({ currentBalance: 50 })]);

		await expect(
			service.createMovement({
				accountId: 'acc-1',
				type: 'SAIDA',
				amount: 100,
				description: 'Teste',
			} as any)
		).rejects.toThrow('Saldo insuficiente');
	});

	it('elimina um movimento e reverte o saldo', async () => {
		tx.financialMovement.findFirst.mockResolvedValue({
			id: 'mv-1',
			accountId: 'acc-1',
			type: 'SAIDA',
			amount: 300,
			isReconciled: false,
			transferId: null,
		});

		await service.deleteMovement('mv-1');

		expect(tx.financialMovement.delete).toHaveBeenCalledWith({ where: { id: 'mv-1' } });
		expect(tx.financialAccount.update).toHaveBeenCalledWith({
			where: { id: 'acc-1' },
			data: { currentBalance: { increment: 300 } },
		});
	});

	it('não elimina movimentos já reconciliados', async () => {
		tx.financialMovement.findFirst.mockResolvedValue({
			id: 'mv-1',
			accountId: 'acc-1',
			type: 'ENTRADA',
			amount: 300,
			isReconciled: true,
			transferId: null,
		});

		await expect(service.deleteMovement('mv-1')).rejects.toThrow('reconciliado');
	});

	it('devolve as duas pernas da transferência', async () => {
		tx.financialAccount.findFirst
			.mockResolvedValueOnce(account({ id: 'acc-1', name: 'Caixa' }))
			.mockResolvedValueOnce(account({ id: 'acc-2', name: 'Banco' }));

		const result = await service.transfer({
			originAccountId: 'acc-1',
			destinationAccountId: 'acc-2',
			amount: 250,
		} as any);

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		expect(result[0]?.accountId).toBe('acc-1');
		expect(result[1]?.accountId).toBe('acc-2');
	});
});
