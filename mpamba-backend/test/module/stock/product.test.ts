import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../../../src/services/module/stock/product.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		product: {
			findMany: vi.fn(),
			count: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			aggregate: vi.fn(),
			fields: { minStock: 'minStock' },
		},
		productCategory: {
			findFirst: vi.fn(),
		},
		stockMovement: {
			count: vi.fn(),
			groupBy: vi.fn(),
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

describe('ProductService', () => {
	let service: ProductService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new ProductService();
	});

	describe('findAllProducts', () => {
		it('deve listar produtos da organização com paginação', async () => {
			const mockProducts = [{ id: 'p1', name: 'Arroz 5kg', sku: 'ARR001' }];
			(prisma.product.findMany as any).mockResolvedValue(mockProducts);
			(prisma.product.count as any).mockResolvedValue(1);

			const result = await service.findAllProducts();

			expect(result.data).toEqual(mockProducts);
			expect(result.pagination.total).toBe(1);
			expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({ organizationId: 'org-1' })
			}));
		});

		it('deve aplicar filtro de pesquisa por nome ou SKU', async () => {
			(prisma.product.findMany as any).mockResolvedValue([]);
			(prisma.product.count as any).mockResolvedValue(0);

			await service.findAllProducts({ search: 'arroz' });

			expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({
					OR: expect.arrayContaining([
						expect.objectContaining({ name: expect.any(Object) })
					])
				})
			}));
		});
	});

	describe('findProductById', () => {
		it('deve retornar produto por id', async () => {
			const mockProduct = { id: 'p1', name: 'Arroz 5kg', organizationId: 'org-1' };
			(prisma.product.findFirst as any).mockResolvedValue(mockProduct);

			const result = await service.findProductById('p1');
			expect(result).toEqual(mockProduct);
		});

		it('deve lançar erro se produto não existir', async () => {
			(prisma.product.findFirst as any).mockResolvedValue(null);

			await expect(service.findProductById('inexistente')).rejects.toThrow('Produto não encontrado');
		});
	});

	describe('createProduct', () => {
		it('deve criar produto com sucesso', async () => {
			const dto = { name: 'Arroz 5kg', sku: 'ARR001', unit: 'KG' };
			const created = { id: 'p-new', ...dto, organizationId: 'org-1', currentQuantity: 0 };

			(prisma.product.findFirst as any).mockResolvedValue(null); // sem duplicado de SKU
			(prisma.product.create as any).mockResolvedValue(created);

			const result = await service.createProduct(dto as any);

			expect(result.currentQuantity).toBe(0);
			expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({ organizationId: 'org-1', currentQuantity: 0 })
			}));
		});

		it('deve lançar erro se SKU já existir', async () => {
			(prisma.product.findFirst as any).mockResolvedValue({ id: 'existing', sku: 'ARR001' });

			await expect(service.createProduct({ sku: 'ARR001' } as any)).rejects.toThrow('SKU "ARR001" já está em uso');
		});

		it('deve lançar erro se categoria não existir', async () => {
			(prisma.product.findFirst as any).mockResolvedValue(null);
			(prisma.productCategory.findFirst as any).mockResolvedValue(null);

			await expect(service.createProduct({ sku: 'NEW001', categoryId: 'cat-invalid' } as any))
				.rejects.toThrow('Categoria não encontrada');
		});
	});

	describe('updateProduct', () => {
		it('deve bloquear alteração directa de currentQuantity', async () => {
			await expect(service.updateProduct('p1', { currentQuantity: 100 } as any))
				.rejects.toThrow('Alteração direta de "currentQuantity" é proibida');
		});

		it('deve lançar erro se produto não existir', async () => {
			(prisma.product.findFirst as any).mockResolvedValue(null);

			await expect(service.updateProduct('inexistente', { name: 'Novo Nome' })).rejects.toThrow('Produto não encontrado');
		});

		it('deve actualizar produto com sucesso', async () => {
			const existing = { id: 'p1', sku: 'ARR001', categoryId: null, organizationId: 'org-1' };
			(prisma.product.findFirst as any).mockResolvedValue(existing);
			(prisma.product.update as any).mockResolvedValue({ ...existing, name: 'Arroz Actualizado' });

			const result = await service.updateProduct('p1', { name: 'Arroz Actualizado' });
			expect(result.name).toBe('Arroz Actualizado');
		});
	});

	describe('deleteProduct', () => {
		it('deve desactivar produto se tiver movimentações', async () => {
			(prisma.product.findFirst as any).mockResolvedValue({ id: 'p1' });
			(prisma.stockMovement.count as any).mockResolvedValue(3);
			(prisma.product.update as any).mockResolvedValue({ id: 'p1', isActive: false });

			const result = await service.deleteProduct('p1');

			expect(prisma.product.delete).not.toHaveBeenCalled();
			expect(prisma.product.update).toHaveBeenCalledWith({
				where: { id: 'p1' },
				data: { isActive: false }
			});
			expect(result.isActive).toBe(false);
		});

		it('deve eliminar produto se não tiver movimentações', async () => {
			(prisma.product.findFirst as any).mockResolvedValue({ id: 'p1' });
			(prisma.stockMovement.count as any).mockResolvedValue(0);
			(prisma.product.delete as any).mockResolvedValue({ id: 'p1' });

			await service.deleteProduct('p1');
			expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
		});
	});

	describe('checkLowStock', () => {
		it('deve emitir aviso se stock estiver abaixo do mínimo', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const product = { name: 'Arroz', sku: 'ARR001', currentQuantity: 5, minStock: 10, unit: 'KG' };

			service.checkLowStock(product);
			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ALERTA STOCK BAIXO'));
			consoleSpy.mockRestore();
		});

		it('não deve emitir aviso se stock estiver acima do mínimo', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const product = { name: 'Arroz', sku: 'ARR001', currentQuantity: 50, minStock: 10, unit: 'KG' };

			service.checkLowStock(product);
			expect(consoleSpy).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});
