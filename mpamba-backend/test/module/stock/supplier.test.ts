import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupplierService } from '../../../src/services/module/stock/supplier.service.js';
import { prisma } from '../../../src/config/prisma.config.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		supplier: {
			findMany: vi.fn(),
			count: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		stockMovement: {
			count: vi.fn(),
		},
	},
}));

vi.mock('../../../src/shared/utils/organization.context.js', () => ({
	organizationContext: {
		getOrganizationId: vi.fn().mockReturnValue('org-1'),
	},
}));

describe('SupplierService', () => {
	let service: SupplierService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new SupplierService();
	});

	describe('findAllSuppliers', () => {
		it('deve listar fornecedores com paginação', async () => {
			(prisma.supplier.findMany as any).mockResolvedValue([{ id: 's1', name: 'Distribuidora ABC' }]);
			(prisma.supplier.count as any).mockResolvedValue(1);

			const result = await service.findAllSuppliers();

			expect(result.data).toHaveLength(1);
			expect(result.pagination.total).toBe(1);
		});
	});

	describe('findSupplierById', () => {
		it('deve retornar o fornecedor correcto', async () => {
			(prisma.supplier.findFirst as any).mockResolvedValue({ id: 's1', name: 'Distribuidora ABC' });

			const result = await service.findSupplierById('s1');
			expect(result.name).toBe('Distribuidora ABC');
		});

		it('deve lançar erro se o fornecedor não existir', async () => {
			(prisma.supplier.findFirst as any).mockResolvedValue(null);

			await expect(service.findSupplierById('inexistente')).rejects.toThrow('Fornecedor não encontrado');
		});
	});

	describe('createSupplier', () => {
		it('deve criar fornecedor sem NIF', async () => {
			(prisma.supplier.create as any).mockResolvedValue({ id: 's-new', name: 'Novo Fornecedor' });

			const result = await service.createSupplier({ name: 'Novo Fornecedor' } as any);
			expect(result.name).toBe('Novo Fornecedor');
		});

		it('deve lançar erro se NIF já estiver em uso', async () => {
			(prisma.supplier.findFirst as any).mockResolvedValue({ id: 'existing', nif: '123456789' });

			await expect(service.createSupplier({ name: 'Teste', nif: '123456789' } as any))
				.rejects.toThrow('NIF "123456789" já existe');
		});
	});

	describe('deleteSupplier', () => {
		it('deve desactivar fornecedor com movimentações associadas', async () => {
			(prisma.supplier.findFirst as any).mockResolvedValue({ id: 's1' });
			(prisma.stockMovement.count as any).mockResolvedValue(2);
			(prisma.supplier.update as any).mockResolvedValue({ id: 's1', isActive: false });

			const result = await service.deleteSupplier('s1');

			expect(prisma.supplier.delete).not.toHaveBeenCalled();
			expect(result.isActive).toBe(false);
		});

		it('deve eliminar fornecedor sem movimentações', async () => {
			(prisma.supplier.findFirst as any).mockResolvedValue({ id: 's1' });
			(prisma.stockMovement.count as any).mockResolvedValue(0);
			(prisma.supplier.delete as any).mockResolvedValue({ id: 's1' });

			await service.deleteSupplier('s1');
			expect(prisma.supplier.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
		});
	});
});
