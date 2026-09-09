import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	EXPIRY_WARNING_DAYS,
	daysUntilExpiry,
	expiryDateBounds,
	expiryStatusOf,
} from '../../../src/services/module/stock/expiry.constants.js';
import { createProductSchema, updateProductSchema } from '../../../src/shared/dto/stock.dto.js';
import { AlertsService } from '../../../src/services/core/alerts.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { NotificationService } from '../../../src/services/core/notification.service.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		product: { findMany: vi.fn(), update: vi.fn() },
		invoice: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn() },
		financialAccount: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn(), updateMany: vi.fn() },
	},
}));

vi.mock('../../../src/services/core/notification.service.js', () => ({
	NotificationService: { notifyOrganization: vi.fn().mockResolvedValue(undefined) },
}));

/** 2026-09-09, como meia-noite UTC — a forma como a validade é guardada. */
const reference = new Date('2026-09-09T00:00:00.000Z');
const utcDay = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('daysUntilExpiry', () => {
	it('conta 0 no dia da validade', () => {
		expect(daysUntilExpiry(utcDay('2026-09-09'), reference)).toBe(0);
	});

	it('conta os dias que faltam', () => {
		expect(daysUntilExpiry(utcDay('2026-09-19'), reference)).toBe(10);
	});

	it('conta negativo quando já passou', () => {
		expect(daysUntilExpiry(utcDay('2026-09-04'), reference)).toBe(-5);
	});

	it('não é afetado pela hora do dia da referência', () => {
		const lateInTheDay = new Date('2026-09-09T23:30:00.000Z');
		expect(daysUntilExpiry(utcDay('2026-09-10'), lateInTheDay)).toBe(1);
	});
});

describe('expiryStatusOf', () => {
	it('classifica um produto sem validade', () => {
		expect(expiryStatusOf(null, reference)).toBe('SEM_VALIDADE');
	});

	it('classifica um produto ainda longe da validade', () => {
		expect(expiryStatusOf(utcDay('2026-12-31'), reference)).toBe('VALIDO');
	});

	it('classifica um produto dentro da janela de aviso', () => {
		expect(expiryStatusOf(utcDay('2026-09-20'), reference)).toBe('A_EXPIRAR');
	});

	it('trata o produto como válido no próprio dia da validade', () => {
		expect(expiryStatusOf(utcDay('2026-09-09'), reference)).toBe('A_EXPIRAR');
	});

	it('classifica um produto já expirado', () => {
		expect(expiryStatusOf(utcDay('2026-09-08'), reference)).toBe('EXPIRADO');
	});

	it('usa o último dia da janela de aviso como limite', () => {
		const lastDay = new Date(reference.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
		expect(expiryStatusOf(lastDay, reference)).toBe('A_EXPIRAR');
		expect(expiryStatusOf(new Date(lastDay.getTime() + 24 * 60 * 60 * 1000), reference)).toBe('VALIDO');
	});
});

describe('expiryDateBounds', () => {
	it('usa a meia-noite de hoje como limite dos expirados', () => {
		expect(expiryDateBounds(new Date('2026-09-09T18:45:00.000Z')).expiredBefore.toISOString()).toBe(
			'2026-09-09T00:00:00.000Z'
		);
	});

	it('estende a janela de aviso pelos dias de antecedência', () => {
		expect(expiryDateBounds(reference).warningUntil.toISOString()).toBe('2026-10-09T00:00:00.000Z');
	});
});

describe('DTOs de produto com validade', () => {
	const base = { name: 'Leite UHT 1L', sku: 'LAC-001', unit: 'UN' };

	it('aceita a data de validade enviada pelo formulário', () => {
		const result = createProductSchema.safeParse({ ...base, expiryDate: '2026-12-31' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.expiryDate).toEqual(utcDay('2026-12-31'));
	});

	it('trata a data vazia como «sem validade»', () => {
		const result = createProductSchema.safeParse({ ...base, expiryDate: '' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.expiryDate).toBeNull();
	});

	it('aceita um produto sem o campo de validade', () => {
		const result = createProductSchema.safeParse(base);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.expiryDate).toBeUndefined();
	});

	it('recusa uma data inválida', () => {
		expect(createProductSchema.safeParse({ ...base, expiryDate: 'ontem' }).success).toBe(false);
	});

	it('permite limpar a validade na atualização', () => {
		const result = updateProductSchema.safeParse({ expiryDate: null });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.expiryDate).toBeNull();
	});
});

describe('AlertsService — validade dos produtos', () => {
	const product = (overrides: Record<string, unknown> = {}) => ({
		id: 'prod-1',
		name: 'Leite UHT 1L',
		sku: 'LAC-001',
		unit: 'UN',
		currentQuantity: 24,
		expiryDate: utcDay('2026-09-20'),
		organizationId: 'org-1',
		...overrides,
	});

	beforeEach(() => {
		vi.clearAllMocks();
		(prisma.invoice.findMany as any).mockResolvedValue([]);
		(prisma.financialAccount.findMany as any).mockResolvedValue([]);
	});

	it('só procura produtos ativos, com stock, com validade dentro da janela e ainda sem aviso', async () => {
		(prisma.product.findMany as any).mockResolvedValue([]);

		await AlertsService.runChecks();

		const where = (prisma.product.findMany as any).mock.calls[0][0].where;
		expect(where.isActive).toBe(true);
		expect(where.currentQuantity).toEqual({ gt: 0 });
		expect(where.expiryAlertedAt).toBeNull();
		expect(where.expiryDate.not).toBeNull();
		expect(where.expiryDate.lte).toBeInstanceOf(Date);
	});

	it('notifica e marca o aviso para não repetir no dia seguinte', async () => {
		(prisma.product.findMany as any).mockResolvedValue([product()]);

		await AlertsService.runChecks();

		expect(prisma.product.update).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: 'prod-1' }, data: { expiryAlertedAt: expect.any(Date) } })
		);
		expect(NotificationService.notifyOrganization).toHaveBeenCalledWith(
			'org-1',
			expect.objectContaining({ title: 'Validade a terminar', type: 'WARNING' })
		);
	});

	it('distingue um produto já expirado na mensagem', async () => {
		(prisma.product.findMany as any).mockResolvedValue([product({ expiryDate: utcDay('2020-01-01') })]);

		await AlertsService.runChecks();

		expect(NotificationService.notifyOrganization).toHaveBeenCalledWith(
			'org-1',
			expect.objectContaining({ title: 'Produto expirado' })
		);
		const { message } = (NotificationService.notifyOrganization as any).mock.calls[0][1];
		expect(message).toContain('expirou há');
		expect(message).toContain('24 UN em stock');
	});
});
