import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '../../../src/services/module/stock/category.service.js';
import { prisma } from '../../../src/config/prisma.config.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		productCategory: {
			findMany: vi.fn(),
			count: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		product: {
			count: vi.fn(),
		},
	},
}));

vi.mock('../../../src/shared/utils/organization.context.js', () => ({
	organizationContext: {
		getOrganizationId: vi.fn().mockReturnValue('org-1'),
	},
}));

describe('CategoryService', () => {
	let service: CategoryService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new CategoryService();
	});

	describe('findAllCategories', () => {
		it('deve listar categorias com paginação', async () => {
			(prisma.productCategory.findMany as any).mockResolvedValue([{ id: 'c1', name: 'Alimentação' }]);
			(prisma.productCategory.count as any).mockResolvedValue(1);

			const result = await service.findAllCategories();

			expect(result.data).toHaveLength(1);
			expect(result.pagination.total).toBe(1);
		});
	});

	describe('findCategoryById', () => {
		it('deve retornar a categoria correcta', async () => {
			const cat = { id: 'c1', name: 'Alimentação', organizationId: 'org-1' };
			(prisma.productCategory.findFirst as any).mockResolvedValue(cat);

			const result = await service.findCategoryById('c1');
			expect(result.name).toBe('Alimentação');
		});

		it('deve lançar erro se a categoria não existir', async () => {
			(prisma.productCategory.findFirst as any).mockResolvedValue(null);

			await expect(service.findCategoryById('inexistente')).rejects.toThrow('Categoria não encontrada');
		});
	});

	describe('createCategory', () => {
		it('deve criar uma nova categoria', async () => {
			(prisma.productCategory.findFirst as any).mockResolvedValue(null);
			(prisma.productCategory.create as any).mockResolvedValue({ id: 'c-new', name: 'Limpeza' });

			const result = await service.createCategory({ name: 'Limpeza' });
			expect(result.name).toBe('Limpeza');
		});

		it('deve lançar erro se a categoria já existir', async () => {
			(prisma.productCategory.findFirst as any).mockResolvedValue({ id: 'c1', name: 'Alimentação' });

			await expect(service.createCategory({ name: 'Alimentação' })).rejects.toThrow('já existe');
		});
	});

	describe('deleteCategory', () => {
		it('deve eliminar uma categoria sem produtos', async () => {
			(prisma.productCategory.findFirst as any).mockResolvedValue({ id: 'c1' });
			(prisma.product.count as any).mockResolvedValue(0);
			(prisma.productCategory.delete as any).mockResolvedValue({ id: 'c1' });

			await service.deleteCategory('c1');
			expect(prisma.productCategory.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
		});

		it('deve lançar erro se a categoria tiver produtos', async () => {
			(prisma.productCategory.findFirst as any).mockResolvedValue({ id: 'c1' });
			(prisma.product.count as any).mockResolvedValue(5);

			await expect(service.deleteCategory('c1')).rejects.toThrow('com produtos associados');
		});
	});
});
