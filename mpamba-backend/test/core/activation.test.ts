import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivationService } from '../../src/services/core/activation.service.js';
import { prisma } from '../../src/config/prisma.config.js';

vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		organization: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		activationCode: {
			findFirst: vi.fn(),
			deleteMany: vi.fn(),
			create: vi.fn(),
		},
	},
}));

vi.mock('../../src/services/core/subscription.service.js', () => ({
	SubscriptionService: {
		useActivationCode: vi.fn().mockResolvedValue({ subscription: { status: 'ACTIVE' }, plan: 'Pro' }),
	},
}));

describe('ActivationService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('generateCode', () => {
		it('deve gerar um código de activação para uma organização com plano', async () => {
			(prisma.organization.findUnique as any).mockResolvedValue({
				id: 'org-1',
				planId: 'plan-1',
				plan: { name: 'Pro' }
			});
			(prisma.activationCode.deleteMany as any).mockResolvedValue({ count: 0 });
			(prisma.activationCode.create as any).mockResolvedValue({
				id: 'code-1',
				code: 'ABC12345',
				planId: 'plan-1',
				organizationId: 'org-1',
			});

			const result = await ActivationService.generateCode('org-1');

			expect(result.code).toBe('ABC12345');
			expect(prisma.activationCode.deleteMany).toHaveBeenCalledWith({
				where: { organizationId: 'org-1', isUsed: false }
			});
			expect(prisma.activationCode.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					planId: 'plan-1',
					organizationId: 'org-1',
					isUsed: false
				})
			}));
		});

		it('deve lançar erro se a organização não for encontrada', async () => {
			(prisma.organization.findUnique as any).mockResolvedValue(null);

			await expect(ActivationService.generateCode('inexistente'))
				.rejects.toThrow('Organização não encontrada');
		});

		it('deve lançar erro se a organização não tiver plano associado', async () => {
			(prisma.organization.findUnique as any).mockResolvedValue({
				id: 'org-sem-plano',
				planId: null,
				plan: null
			});

			await expect(ActivationService.generateCode('org-sem-plano'))
				.rejects.toThrow('plano associado');
		});
	});

	describe('activateOrganization', () => {
		it('deve activar uma organização com código válido', async () => {
			(prisma.activationCode.findFirst as any).mockResolvedValue({
				id: 'code-1',
				code: 'VAL123',
				isUsed: false,
			});

			const result = await ActivationService.activateOrganization('VAL123', 'org-1');

			expect(prisma.organization.update).toHaveBeenCalledWith({
				where: { id: 'org-1' },
				data: { isActive: true }
			});
			expect(result.subscription.status).toBe('ACTIVE');
		});

		it('deve lançar erro se o código for inválido ou expirado', async () => {
			(prisma.activationCode.findFirst as any).mockResolvedValue(null);

			await expect(ActivationService.activateOrganization('INVALIDO', 'org-1'))
				.rejects.toThrow('inválido ou expirado');
		});
	});
});
