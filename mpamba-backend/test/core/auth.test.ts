import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/services/core/auth.service.js';
import { prisma } from '../../src/config/prisma.config.js';

// Mocking prisma
vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
			updateMany: vi.fn(),
		},
		role: {
			findFirst: vi.fn(),
			create: vi.fn(),
		},
		rolePermission: {
			createMany: vi.fn(),
		},
		userRole: {
			create: vi.fn(),
		},
		plan: {
			findUnique: vi.fn(),
		},
		organization: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		module: {
			findMany: vi.fn(),
		},
		organizationModule: {
			findMany: vi.fn(),
			upsert: vi.fn(),
		},
		permission: {
			findMany: vi.fn(),
		},
	},
}));

vi.mock('../../src/services/core/activation.service.js', () => ({
	ActivationService: {
		generateCode: vi.fn().mockResolvedValue({ code: '123456' }),
	},
}));

vi.mock('../../src/shared/utils/email.utils.js', () => ({
	sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../../src/services/core/subscription.service.js', () => ({
	SubscriptionService: {
		useActivationCode: vi.fn().mockResolvedValue({ id: 'sub-1' }),
	},
}));

// Mocking JWT and Refresh strategies
vi.mock('../../src/shared/utils/jwt.strategy.js', () => ({
	JwtStrategy: {
		sign: vi.fn().mockReturnValue('mock-access-token'),
	},
}));

vi.mock('../../src/shared/utils/refresh.strategy.js', () => ({
	RefreshStrategy: {
		sign: vi.fn().mockReturnValue('mock-refresh-token'),
		verify: vi.fn().mockReturnValue({ sub: 'user-1' }),
	},
}));

describe('AuthService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('login', () => {
		it('deve realizar login com sucesso para um usuário ativo', async () => {
			const mockUser = {
				id: 'user-1',
				name: 'Emanuel Malungo',
				email: 'emanuel@example.com',
				passwordHash: bcrypt.hashSync('password123', 10),
				isActive: true,
				organizationId: 'org-1',
				roles: [
					{
						role: {
							name: 'Admin',
							permissions: [
								{ permission: { code: 'INVOICE_CREATE' } }
							]
						}
					}
				],
				organization: {
					id: 'org-1',
					name: 'Empresa Teste',
					isActive: true
				}
			};

			(prisma.user.findUnique as any).mockResolvedValue(mockUser);
			(prisma.organizationModule.findMany as any).mockResolvedValue([
				{ code: 'billing' }
			]);

			const result = await AuthService.login('emanuel@example.com', 'password123');

			expect(result.accessToken).toBe('mock-access-token');
			expect(result.user.name).toBe('Emanuel Malungo');
			expect(result.user.permissions).toContain('INVOICE_CREATE');
			expect(result.user.modules).toContain('billing');
		});

		it('deve lançar erro se as credenciais forem inválidas (usuário não existe)', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);

			await expect(AuthService.login('nonexistent@example.com', 'any'))
				.rejects.toThrow('Credenciais inválidas');
		});

		it('deve lançar erro se a senha estiver incorreta', async () => {
			const mockUser = {
				email: 'test@example.com',
				passwordHash: bcrypt.hashSync('correct-password', 10)
			};
			(prisma.user.findUnique as any).mockResolvedValue(mockUser);

			await expect(AuthService.login('test@example.com', 'wrong-password'))
				.rejects.toThrow('Credenciais inválidas');
		});

		it('deve lançar erro se o usuário estiver inativo', async () => {
			const mockUser = {
				email: 'inactive@example.com',
				passwordHash: bcrypt.hashSync('pass', 10),
				isActive: false
			};
			(prisma.user.findUnique as any).mockResolvedValue(mockUser);

			await expect(AuthService.login('inactive@example.com', 'pass'))
				.rejects.toThrow('Sua conta está inativa');
		});

		it('deve lançar erro se a organização estiver inativa (pendente)', async () => {
			const mockUser = {
				email: 'test@org.com',
				passwordHash: bcrypt.hashSync('pass', 10),
				isActive: true,
				organizationId: 'org-pending',
				organization: {
					isActive: false
				}
			};
			(prisma.user.findUnique as any).mockResolvedValue(mockUser);

			await expect(AuthService.login('test@org.com', 'pass'))
				.rejects.toThrow('Sua organização está pendente de aprovação');
		});

		it('deve realizar login para Super Admin (sem organização)', async () => {
			const mockSuperAdmin = {
				id: 'admin-1',
				email: 'admin@mpamba.com',
				passwordHash: bcrypt.hashSync('admin123', 10),
				isActive: true,
				organizationId: null,
				roles: [{ role: { name: 'SuperAdmin', permissions: [] } }],
				organization: null
			};

			(prisma.user.findUnique as any).mockResolvedValue(mockSuperAdmin);
			(prisma.module.findMany as any).mockResolvedValue([{ code: 'billing' }, { code: 'stock' }]);

			const result = await AuthService.login('admin@mpamba.com', 'admin123');

			expect(result.user.modules).toHaveLength(2);
			expect(result.user.organization).toBeNull();
		});
	});

	describe('refresh', () => {
		it('deve gerar novo access token com refresh token válido', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({
				id: 'user-1',
				isActive: true,
				roles: [{ role: { name: 'Admin' } }]
			});

			const result = await AuthService.refresh('valid-refresh-token');
			expect(result.accessToken).toBe('mock-access-token');
		});

		it('deve lançar erro se o usuário for inválido ou inativo no refresh', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);
			await expect(AuthService.refresh('token')).rejects.toThrow('Usuário inválido');
		});
	});

	describe('register', () => {
		const registerData = {
			orgName: 'Nova Org',
			nif: '123',
			adminName: 'Admin',
			adminEmail: 'new@org.com',
			password: 'pass',
			planId: 'plan-1'
		};

		it('deve registar uma nova organização e administrador pendentes', async () => {
			(prisma.user.findUnique as any).mockResolvedValue(null);
			(prisma.plan.findUnique as any).mockResolvedValue({ id: 'plan-1', name: 'Plano Pro' });
			(prisma.organization.create as any).mockResolvedValue({ id: 'org-new', name: 'Nova Org' });
			(prisma.user.create as any).mockResolvedValue({ id: 'user-new', name: 'Admin' });
			(prisma.role.findFirst as any).mockResolvedValue({ id: 'role-1' });

			const result = await AuthService.register(registerData);

			expect(result.message).toContain('sucesso');
			expect(prisma.organization.create).toHaveBeenCalled();
			expect(prisma.user.create).toHaveBeenCalled();
		});

		it('deve impedir registo se o email já existir', async () => {
			(prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });
			await expect(AuthService.register(registerData)).rejects.toThrow('email já está em uso');
		});
	});

	describe('approveOrganization', () => {
		it('deve aprovar e enviar email de ativação para org pendente', async () => {
			const mockOrg = {
				id: 'org-1',
				name: 'Teste',
				isActive: false,
				users: [{ id: 'u1', name: 'Admin', email: 'admin@test.com' }],
				plan: { name: 'Pro' }
			};

			(prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

			const result = await AuthService.approveOrganization('org-1');

			expect(result.activationCode).toBe('123456');
			expect(result.message).toContain('sucesso');
		});

		it('deve lançar erro se a organização já estiver ativa', async () => {
			(prisma.organization.findUnique as any).mockResolvedValue({ isActive: true });
			await expect(AuthService.approveOrganization('org-1')).rejects.toThrow('já está ativa');
		});
	});

	describe('Ativação de Organizações', () => {
		it('activate: deve ativar organização e seus usuários', async () => {
			(prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-1', isActive: false });

			const result = await AuthService.activate('org-1');

			expect(result.message).toContain('sucesso');
			expect(prisma.organization.update).toHaveBeenCalledWith({
				where: { id: 'org-1' },
				data: { isActive: true }
			});
			expect(prisma.user.updateMany).toHaveBeenCalled();
		});

		it('activateOrganizationDirectly: deve ativar e provisionar módulos do plano', async () => {
			const mockOrg = {
				id: 'org-1',
				isActive: false,
				plan: {
					modules: [{ moduleId: 'mod-1' }]
				},
				users: [{ name: 'Admin', email: 'admin@test.com' }]
			};
			(prisma.organization.findUnique as any).mockResolvedValue(mockOrg);
			(prisma.organizationModule.upsert as any).mockResolvedValue({});

			const result = await AuthService.activateOrganizationDirectly('org-1');

			expect(result.message).toContain('sucesso');
			expect(prisma.organizationModule.upsert).toHaveBeenCalled();
		});

		it('activateWithCode: deve ativar usando código e integrar com SubscriptionService', async () => {
			const mockOrg = {
				id: 'org-1',
				isActive: false,
				users: [{ name: 'Admin', email: 'admin@test.com' }],
				name: 'Empresa Teste'
			};
			(prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

			const result = await AuthService.activateWithCode('org-1', '123456');

			expect(result.message).toContain('sucesso');
			expect(result.subscription).toBeDefined();
		});
	});

	describe('listPendingOrganizations', () => {
		it('deve retornar lista de organizações não ativas', async () => {
			(prisma.organization.findMany as any).mockResolvedValue([{ id: 'org-1' }]);

			const result = await AuthService.listPendingOrganizations();

			expect(result).toHaveLength(1);
			expect(prisma.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: { isActive: false }
			}));
		});
	});
});
