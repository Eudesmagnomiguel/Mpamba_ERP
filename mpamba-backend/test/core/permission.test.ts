import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionService } from '../../src/services/core/permission.service.js';
import { prisma } from '../../src/config/prisma.config.js';

vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		permission: {
			findMany: vi.fn(),
			count: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
	},
}));

describe('PermissionService', () => {
	let service: PermissionService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new PermissionService();
	});

	describe('findAll', () => {
		it('deve listar permissões com paginação', async () => {
			const mockPerms = [
				{ id: 'p1', code: 'INVOICE_CREATE' },
				{ id: 'p2', code: 'INVOICE_READ' },
			];
			(prisma.permission.findMany as any).mockResolvedValue(mockPerms);
			(prisma.permission.count as any).mockResolvedValue(2);

			const result = await service.findAll({ page: 1, pageSize: 10 });

			expect(result.data).toHaveLength(2);
			expect(result.pagination.total).toBe(2);
			expect(result.pagination.hasNextPage).toBe(false);
		});

		it('deve calcular paginação correctamente', async () => {
			(prisma.permission.findMany as any).mockResolvedValue([]);
			(prisma.permission.count as any).mockResolvedValue(25);

			const result = await service.findAll({ page: 2, pageSize: 10 });

			expect(result.pagination.page).toBe(2);
			expect(result.pagination.totalPages).toBe(3);
			expect(result.pagination.hasPreviousPage).toBe(true);
			expect(result.pagination.hasNextPage).toBe(true);
		});
	});

	describe('findById', () => {
		it('deve retornar uma permissão pelo id', async () => {
			const mockPerm = { id: 'p1', code: 'INVOICE_CREATE' };
			(prisma.permission.findUnique as any).mockResolvedValue(mockPerm);

			const result = await service.findById('p1');

			expect(result).toEqual(mockPerm);
			expect(prisma.permission.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
		});

		it('deve retornar null se a permissão não existir', async () => {
			(prisma.permission.findUnique as any).mockResolvedValue(null);

			const result = await service.findById('inexistente');
			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('deve criar uma nova permissão', async () => {
			const dto = { code: 'STOCK_DELETE', description: 'Pode eliminar produtos' };
			const created = { id: 'p-new', ...dto };
			(prisma.permission.create as any).mockResolvedValue(created);

			const result = await service.create(dto);

			expect(prisma.permission.create).toHaveBeenCalledWith({
				data: { code: 'STOCK_DELETE', description: 'Pode eliminar produtos' }
			});
			expect(result.code).toBe('STOCK_DELETE');
		});

		it('deve guardar null na descrição quando não fornecida', async () => {
			const dto = { code: 'STOCK_READ' };
			(prisma.permission.create as any).mockResolvedValue({ id: 'p-new', code: 'STOCK_READ', description: null });

			await service.create(dto);

			expect(prisma.permission.create).toHaveBeenCalledWith({
				data: { code: 'STOCK_READ', description: null }
			});
		});
	});

	describe('update', () => {
		it('deve actualizar uma permissão existente', async () => {
			const dto = { code: 'INVOICE_CREATE_V2', description: 'Versão actualizada' };
			const updated = { id: 'p1', ...dto };
			(prisma.permission.update as any).mockResolvedValue(updated);

			const result = await service.update('p1', dto);

			expect(prisma.permission.update).toHaveBeenCalledWith({
				where: { id: 'p1' },
				data: { code: 'INVOICE_CREATE_V2', description: 'Versão actualizada' }
			});
			expect(result.code).toBe('INVOICE_CREATE_V2');
		});
	});
});
