import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../src/services/core/user.service.js';
import { prisma } from '../../src/config/prisma.config.js';

vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		user: {
			findMany: vi.fn(),
			count: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		userRole: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
		$transaction: vi.fn((ops) => Promise.all(ops)),
	},
}));

describe('UserService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('listUsers', () => {
		it('deve listar todos os utilizadores sem filtro (Super Admin)', async () => {
			const mockUsers = [
				{ id: 'u1', name: 'Emanuel', email: 'e@test.com' },
				{ id: 'u2', name: 'Maria', email: 'm@test.com' },
			];
			(prisma.user.findMany as any).mockResolvedValue(mockUsers);
			(prisma.user.count as any).mockResolvedValue(2);

			const result = await UserService.listUsers();

			expect(result.data).toHaveLength(2);
			expect(result.pagination.total).toBe(2);
			expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: {}
			}));
		});

		it('deve filtrar utilizadores por organização', async () => {
			(prisma.user.findMany as any).mockResolvedValue([{ id: 'u1', name: 'Emanuel' }]);
			(prisma.user.count as any).mockResolvedValue(1);

			const result = await UserService.listUsers({ organizationId: 'org-1' });

			expect(result.data).toHaveLength(1);
			expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: { organizationId: 'org-1' }
			}));
		});

		it('deve calcular paginação correctamente', async () => {
			(prisma.user.findMany as any).mockResolvedValue([]);
			(prisma.user.count as any).mockResolvedValue(35);

			const result = await UserService.listUsers({ page: 2, pageSize: 10 });

			expect(result.pagination.totalPages).toBe(4);
			expect(result.pagination.hasPreviousPage).toBe(true);
			expect(result.pagination.hasNextPage).toBe(true);
		});
	});

	describe('getUserById', () => {
		it('deve retornar o utilizador pelo id', async () => {
			const mockUser = { id: 'u1', name: 'Emanuel', organizationId: 'org-1' };
			(prisma.user.findUnique as any).mockResolvedValue(mockUser);

			const result = await UserService.getUserById('u1');
			expect(result.name).toBe('Emanuel');
		});

		it('deve lançar erro se o utilizador não existir', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);

			await expect(UserService.getUserById('inexistente')).rejects.toThrow('Usuário não encontrado');
		});

		it('deve lançar erro de permissão se org for diferente', async () => {
			const mockUser = { id: 'u1', name: 'Emanuel', organizationId: 'org-2' };
			(prisma.user.findUnique as any).mockResolvedValue(mockUser);

			await expect(UserService.getUserById('u1', 'org-1'))
				.rejects.toThrow('Sem permissão para ver este usuário');
		});

		it('deve permitir acesso se a org for a mesma', async () => {
			const mockUser = { id: 'u1', name: 'Emanuel', organizationId: 'org-1' };
			(prisma.user.findUnique as any).mockResolvedValue(mockUser);

			const result = await UserService.getUserById('u1', 'org-1');
			expect(result.name).toBe('Emanuel');
		});
	});

	describe('createUser', () => {
		it('deve criar um novo utilizador com roles', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null); // email livre
			(prisma.user.create as any).mockResolvedValue({
				id: 'u-new',
				name: 'Novo User',
				email: 'novo@test.com',
				isActive: true,
				roles: [{ role: { name: 'Viewer' } }]
			});

			const result = await UserService.createUser({
				name: 'Novo User',
				email: 'novo@test.com',
				password: 'pass123',
				organizationId: 'org-1',
				roleIds: ['role-1']
			});

			expect(result.name).toBe('Novo User');
			expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					email: 'novo@test.com',
					organizationId: 'org-1',
					isActive: true,
				})
			}));
		});

		it('deve lançar erro se o email já estiver em uso', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });

			await expect(UserService.createUser({
				name: 'Teste',
				email: 'existente@test.com',
				password: 'pass'
			})).rejects.toThrow('email já está em uso');
		});

		it('deve criar utilizador inactivo quando isActive=false', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);
			(prisma.user.create as any).mockResolvedValue({ id: 'u-new', isActive: false, roles: [] });

			await UserService.createUser({
				name: 'Inactivo',
				email: 'inactivo@test.com',
				password: 'pass',
				isActive: false
			});

			expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({ isActive: false })
			}));
		});
	});

	describe('updateUser', () => {
		it('deve actualizar o utilizador com sucesso', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', organizationId: 'org-1' });
			(prisma.user.update as any).mockResolvedValue({ id: 'u1', name: 'Actualizado', roles: [] });

			const result = await UserService.updateUser('u1', { name: 'Actualizado' }, 'org-1');
			expect(result.name).toBe('Actualizado');
		});

		it('deve substituir roles se roleIds for fornecido', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', organizationId: 'org-1' });
			(prisma.user.update as any).mockResolvedValue({ id: 'u1', roles: [] });

			await UserService.updateUser('u1', { roleIds: ['role-new'] }, 'org-1');

			expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
			expect(prisma.userRole.createMany).toHaveBeenCalledWith({
				data: [{ userId: 'u1', roleId: 'role-new' }]
			});
		});

		it('deve lançar erro de permissão cross-org', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', organizationId: 'org-2' });

			await expect(UserService.updateUser('u1', { name: 'Teste' }, 'org-1'))
				.rejects.toThrow('Sem permissão para editar este usuário');
		});

		it('deve lançar erro se o utilizador não existir', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);

			await expect(UserService.updateUser('inexistente', { name: 'Teste' }))
				.rejects.toThrow('Usuário não encontrado');
		});
	});

	describe('deleteUser', () => {
		it('deve eliminar utilizador e as suas roles', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', organizationId: 'org-1' });
			(prisma.userRole.deleteMany as any).mockResolvedValue({ count: 1 });
			(prisma.user.delete as any).mockResolvedValue({ id: 'u1' });

			await UserService.deleteUser('u1', 'org-1');

			expect(prisma.$transaction).toHaveBeenCalled();
		});

		it('deve lançar erro se utilizador não existir', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);

			await expect(UserService.deleteUser('inexistente')).rejects.toThrow('Usuário não encontrado');
		});

		it('deve lançar erro de permissão cross-org', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', organizationId: 'org-2' });

			await expect(UserService.deleteUser('u1', 'org-1'))
				.rejects.toThrow('Sem permissão para excluir este usuário');
		});
	});

	describe('toggleUserStatus', () => {
		it('deve activar um utilizador inactivo', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', isActive: false });
			(prisma.user.update as any).mockResolvedValue({ id: 'u1', isActive: true });

			const result = await UserService.toggleUserStatus('u1', true);
			expect(result.isActive).toBe(true);
			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: 'u1' },
				data: { isActive: true }
			});
		});

		it('deve desactivar um utilizador activo', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', isActive: true });
			(prisma.user.update as any).mockResolvedValue({ id: 'u1', isActive: false });

			const result = await UserService.toggleUserStatus('u1', false);
			expect(result.isActive).toBe(false);
		});

		it('deve lançar erro se o utilizador não existir', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);

			await expect(UserService.toggleUserStatus('inexistente', true))
				.rejects.toThrow('Usuário não encontrado');
		});
	});
});
