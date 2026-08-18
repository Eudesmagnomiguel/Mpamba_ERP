import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleService } from '../../src/services/core/role.service.js';
import { prisma } from '../../src/config/prisma.config.js';
import { organizationContext } from '../../src/shared/utils/organization.context.js';

// Mocking prisma
vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		role: {
			findMany: vi.fn(),
			count: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		organization: {
			findUnique: vi.fn(),
			upsert: vi.fn(),
		},
		rolePermission: {
			create: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		userRole: {
			deleteMany: vi.fn(),
		},
	},
}));

// Mocking organization context
vi.mock('../../src/shared/utils/organization.context.js', () => ({
	organizationContext: {
		getOrganizationId: vi.fn(),
		isSuperAdmin: vi.fn(),
	},
}));

describe('RoleService', () => {
	let service: RoleService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new RoleService();
		(organizationContext.getOrganizationId as any).mockReturnValue('org-1');
		(organizationContext.isSuperAdmin as any).mockReturnValue(false);
	});

	describe('findAll', () => {
		it('deve listar os papéis da organização com paginação', async () => {
			const mockRoles = [{ id: 'role-1', name: 'Admin' }];
			(prisma.role.findMany as any).mockResolvedValue(mockRoles);
			(prisma.role.count as any).mockResolvedValue(1);

			const result = await service.findAll();

			expect(result.data).toEqual(mockRoles);
			expect(prisma.role.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: { organizationId: 'org-1' }
			}));
		});
	});

	describe('findById', () => {
		it('deve retornar um papel pelo id', async () => {
			const mockRole = { id: 'role-1', name: 'Admin' };
			(prisma.role.findFirst as any).mockResolvedValue(mockRole);

			const result = await service.findById('role-1');

			expect(result).toEqual(mockRole);
			expect(prisma.role.findFirst).toHaveBeenCalledWith(expect.objectContaining({
				where: { id: 'role-1', organizationId: 'org-1' }
			}));
		});
	});

	describe('create', () => {
		it('deve criar um novo papel', async () => {
			const createDto = { name: 'Manager', organizationId: 'org-1' };
			(prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-1' });
			(prisma.role.create as any).mockResolvedValue({ id: 'role-new', name: 'Manager' });

			const result = await service.create(createDto);

			expect(prisma.role.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					name: 'Manager',
					organizationId: 'org-1'
				})
			}));
			expect(result.name).toBe('Manager');
		});

		it('deve lançar erro se a organização não existir', async () => {
			const createDto = { name: 'Manager', organizationId: 'org-1' };
			(prisma.organization.findUnique as any).mockResolvedValue(null);

			await expect(service.create(createDto)).rejects.toThrow('Organização não encontrada');
		});
	});

	describe('update', () => {
		it('deve atualizar um papel existente', async () => {
			(prisma.role.findFirst as any).mockResolvedValue({ id: 'role-1' });
			(prisma.role.update as any).mockResolvedValue({ id: 'role-1', name: 'New Name' });

			const result = await service.update('role-1', { name: 'New Name' });

			expect(prisma.role.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { id: 'role-1', organizationId: 'org-1' },
				data: expect.objectContaining({ name: 'New Name' })
			}));
			expect(result.name).toBe('New Name');
		});

		it('deve lançar erro se papel não for encontrado', async () => {
			(prisma.role.findFirst as any).mockResolvedValue(null);

			await expect(service.update('role-1', { name: 'New Name' })).rejects.toThrow('Papel não encontrado');
		});
	});

	describe('delete', () => {
		it('deve deletar um papel e suas relações', async () => {
			(prisma.role.findFirst as any).mockResolvedValue({ id: 'role-1' });

			await service.delete('role-1');

			expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({ where: { roleId: 'role-1' } });
			expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({ where: { roleId: 'role-1' } });
			expect(prisma.role.delete).toHaveBeenCalledWith(expect.objectContaining({
				where: { id: 'role-1', organizationId: 'org-1' }
			}));
		});
	});
});
