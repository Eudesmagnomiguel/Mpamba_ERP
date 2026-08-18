import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MovementService } from '../../../src/services/module/stock/movement.service.js';
import { prisma } from '../../../src/config/prisma.config.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		stockMovement: {
			findMany: vi.fn(),
			count: vi.fn(),
			create: vi.fn(),
			findFirst: vi.fn(),
		},
		product: {
			update: vi.fn(),
		},
		supplier: {
			findFirst: vi.fn(),
		},
		$transaction: vi.fn((cb) => cb(prisma)),
	},
}));

vi.mock('../../../src/shared/utils/organization.context.js', () => ({
	organizationContext: {
		getOrganizationId: vi.fn().mockReturnValue('org-1'),
		getUserId: vi.fn().mockReturnValue('user-1'),
	},
}));

// Mock do productService.checkLowStock para não depender do contexto
vi.mock('../../../src/services/module/stock/product.service.js', () => ({
	productService: { checkLowStock: vi.fn() },
}));

const makeProduct = (overrides: Record<string, any> = {}) => ({
	id: 'p1',
	name: 'Arroz 5kg',
	sku: 'ARR001',
	unit: 'KG',
	currentQuantity: 100,
	isActive: true,
	organizationId: 'org-1',
	...overrides,
});

describe('MovementService', () => {
	let service: MovementService;
	let mockTx: any;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new MovementService();

		mockTx = {
			product: {
				findFirst: vi.fn(),
				update: vi.fn(),
			},
			stockMovement: {
				create: vi.fn(),
				findFirst: vi.fn(),
			},
			supplier: {
				findFirst: vi.fn(),
			},
		};

		(prisma.$transaction as any).mockImplementation((cb: any) => cb(mockTx));
	});

	describe('getMovements', () => {
		it('deve listar movimentações com paginação', async () => {
			(prisma.stockMovement.findMany as any).mockResolvedValue([{ id: 'm1', type: 'ENTRADA' }]);
			(prisma.stockMovement.count as any).mockResolvedValue(1);

			const result = await service.getMovements();
			expect(result.data).toHaveLength(1);
			expect(result.pagination.total).toBe(1);
		});
	});

	describe('addStock (ENTRADA)', () => {
		it('deve registar entrada de stock com sucesso', async () => {
			const product = makeProduct();
			const updatedProduct = makeProduct({ currentQuantity: 150 });
			const movement = { id: 'm1', type: 'ENTRADA', quantity: 50 };

			mockTx.product.findFirst.mockResolvedValue(product);
			mockTx.stockMovement.create.mockResolvedValue(movement);
			mockTx.product.update.mockResolvedValue(updatedProduct);

			const result = await service.addStock('p1', { quantity: 50 } as any);

			expect(result.movement.type).toBe('ENTRADA');
			expect(result.previousQuantity).toBe(100);
			expect(result.newQuantity).toBe(150);
		});

		it('deve lançar erro se produto não existir', async () => {
			mockTx.product.findFirst.mockResolvedValue(null);

			await expect(service.addStock('inexistente', { quantity: 10 } as any))
				.rejects.toThrow('Produto não encontrado');
		});

		it('deve lançar erro se produto estiver desactivado', async () => {
			mockTx.product.findFirst.mockResolvedValue(makeProduct({ isActive: false }));

			await expect(service.addStock('p1', { quantity: 10 } as any))
				.rejects.toThrow('desativado');
		});

		it('deve lançar erro se fornecedor não existir', async () => {
			mockTx.product.findFirst.mockResolvedValue(makeProduct());
			mockTx.supplier.findFirst.mockResolvedValue(null);

			await expect(service.addStock('p1', { quantity: 10, supplierId: 'sup-invalid' } as any))
				.rejects.toThrow('Fornecedor não encontrado');
		});
	});

	describe('removeStock (SAIDA)', () => {
		it('deve registar saída de stock com sucesso', async () => {
			const product = makeProduct({ currentQuantity: 100 });
			const updatedProduct = makeProduct({ currentQuantity: 70 });

			mockTx.product.findFirst.mockResolvedValue(product);
			mockTx.stockMovement.create.mockResolvedValue({ id: 'm2', type: 'SAIDA', quantity: 30 });
			mockTx.product.update.mockResolvedValue(updatedProduct);

			const result = await service.removeStock('p1', { quantity: 30 } as any);

			expect(result.movement.type).toBe('SAIDA');
			expect(result.previousQuantity).toBe(100);
			expect(result.newQuantity).toBe(70);
		});

		it('deve lançar erro se stock for insuficiente', async () => {
			mockTx.product.findFirst.mockResolvedValue(makeProduct({ currentQuantity: 10 }));

			await expect(service.removeStock('p1', { quantity: 50 } as any))
				.rejects.toThrow('Estoque insuficiente');
		});
	});

	describe('adjustStock (AJUSTE)', () => {
		it('deve registar ajuste positivo', async () => {
			const product = makeProduct({ currentQuantity: 50 });
			const updatedProduct = makeProduct({ currentQuantity: 70 });

			mockTx.product.findFirst.mockResolvedValue(product);
			mockTx.stockMovement.create.mockResolvedValue({ id: 'm3', type: 'AJUSTE', quantity: 20 });
			mockTx.product.update.mockResolvedValue(updatedProduct);

			const result = await service.adjustStock('p1', { quantity: 20, reason: 'Inventário' } as any);

			expect(result.newQuantity).toBe(70);
			expect(result.adjustment).toBe(20);
		});

		it('deve lançar erro se ajuste resultar em saldo negativo', async () => {
			mockTx.product.findFirst.mockResolvedValue(makeProduct({ currentQuantity: 10 }));

			await expect(service.adjustStock('p1', { quantity: -50, reason: 'Teste' } as any))
				.rejects.toThrow('saldo negativo');
		});
	});

	describe('reverseMovement', () => {
		it('deve lançar erro se justificativa for curta', async () => {
			await expect(service.reverseMovement('m1', 'ok'))
				.rejects.toThrow('Justificativa de reversão obrigatória');
		});

		it('deve reverter uma ENTRADA como SAIDA', async () => {
			const product = makeProduct({ currentQuantity: 100 });
			const original = {
				id: 'm1',
				type: 'ENTRADA',
				quantity: 50,
				productId: 'p1',
				product,
				organizationId: 'org-1',
			};

			mockTx.stockMovement.findFirst.mockResolvedValue(original);
			mockTx.stockMovement.create.mockResolvedValue({ id: 'm-rev', type: 'SAIDA', quantity: 50 });
			mockTx.product.update.mockResolvedValue(makeProduct({ currentQuantity: 50 }));

			const result = await service.reverseMovement('m1', 'Correcção de inventário');

			expect(result.reversalMovement.type).toBe('SAIDA');
			expect(result.newQuantity).toBe(50);
		});

		it('deve lançar erro se stock actual for insuficiente para reverter ENTRADA', async () => {
			const product = makeProduct({ currentQuantity: 10 });
			const original = {
				id: 'm1',
				type: 'ENTRADA',
				quantity: 50,
				productId: 'p1',
				product,
				organizationId: 'org-1',
			};
			mockTx.stockMovement.findFirst.mockResolvedValue(original);

			await expect(service.reverseMovement('m1', 'Correcção de inventário'))
				.rejects.toThrow('menor que a quantidade a reverter');
		});
	});
});
