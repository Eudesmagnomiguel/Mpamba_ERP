import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RbacService } from '../../src/services/core/rbac.service.js';
import { prisma } from '../../src/config/prisma.config.js';

vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
		},
	},
}));

const mockUserWithRoles = (permissions: string[], roleNames: string[] = ['Admin']) => ({
	id: 'user-1',
	roles: roleNames.map((name) => ({
		role: {
			name,
			permissions: permissions.map((code) => ({
				permission: { code }
			}))
		}
	}))
});

describe('RbacService', () => {
	let service: RbacService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new RbacService();
	});

	describe('hasPermission', () => {
		it('deve retornar true se o utilizador tiver a permissão', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(
				mockUserWithRoles(['INVOICE_CREATE', 'INVOICE_READ'])
			);

			const result = await service.hasPermission('user-1', 'INVOICE_CREATE');
			expect(result).toBe(true);
		});

		it('deve retornar false se o utilizador não tiver a permissão', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(
				mockUserWithRoles(['INVOICE_READ'])
			);

			const result = await service.hasPermission('user-1', 'INVOICE_DELETE');
			expect(result).toBe(false);
		});

		it('deve retornar false se o utilizador não existir', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);

			const result = await service.hasPermission('inexistente', 'INVOICE_CREATE');
			expect(result).toBe(false);
		});

		it('deve verificar permissões em múltiplos papéis', async () => {
			const user = {
				id: 'user-1',
				roles: [
					{
						role: {
							name: 'Viewer',
							permissions: [{ permission: { code: 'INVOICE_READ' } }]
						}
					},
					{
						role: {
							name: 'Manager',
							permissions: [{ permission: { code: 'STOCK_WRITE' } }]
						}
					}
				]
			};
			(prisma.user.findUnique as any).mockResolvedValue(user);

			expect(await service.hasPermission('user-1', 'INVOICE_READ')).toBe(true);
			expect(await service.hasPermission('user-1', 'STOCK_WRITE')).toBe(true);
		});
	});

	describe('hasRole', () => {
		it('deve retornar true se o utilizador tiver o papel', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(
				mockUserWithRoles([], ['Administrador'])
			);

			const result = await service.hasRole('user-1', 'Administrador');
			expect(result).toBe(true);
		});

		it('deve retornar false se o utilizador não tiver o papel', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(
				mockUserWithRoles([], ['Viewer'])
			);

			const result = await service.hasRole('user-1', 'SuperAdmin');
			expect(result).toBe(false);
		});

		it('deve retornar false se o utilizador não existir', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);

			const result = await service.hasRole('inexistente', 'Admin');
			expect(result).toBe(false);
		});
	});

	describe('getUserPermissions', () => {
		it('deve retornar lista de permissões únicas do utilizador', async () => {
			const user = {
				id: 'user-1',
				roles: [
					{
						role: {
							permissions: [
								{ permission: { code: 'INVOICE_CREATE' } },
								{ permission: { code: 'INVOICE_READ' } }
							]
						}
					},
					{
						role: {
							permissions: [
								{ permission: { code: 'INVOICE_READ' } }, // duplicada — deve aparecer uma única vez
								{ permission: { code: 'STOCK_READ' } }
							]
						}
					}
				]
			};
			(prisma.user.findUnique as any).mockResolvedValue(user);

			const result = await service.getUserPermissions('user-1');

			expect(result).toHaveLength(3); // sem duplicados
			expect(result).toContain('INVOICE_CREATE');
			expect(result).toContain('INVOICE_READ');
			expect(result).toContain('STOCK_READ');
		});

		it('deve retornar array vazio se o utilizador não existir', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);

			const result = await service.getUserPermissions('inexistente');
			expect(result).toEqual([]);
		});
	});
});
