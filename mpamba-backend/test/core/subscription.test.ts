import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../../src/services/core/subscription.service.js';
import { prisma } from '../../src/config/prisma.config.js';

// Mocking prisma
vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		subscription: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			upsert: vi.fn(),
			update: vi.fn(),
		},
		organizationModule: {
			findFirst: vi.fn(),
			updateMany: vi.fn(),
			upsert: vi.fn(),
		},
		activationCode: {
			findFirst: vi.fn(),
			update: vi.fn(),
		},
		plan: {
			findUnique: vi.fn(),
		},
		$transaction: vi.fn((callback) => callback(prisma)),
	},
}));

describe('SubscriptionService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('checkSubscriptionStatus', () => {
		it('deve retornar NONE se a subscrição não for encontrada', async () => {
			(prisma.subscription.findUnique as any).mockResolvedValue(null);

			const result = await SubscriptionService.checkSubscriptionStatus('org-1');

			expect(result.status).toBe('NONE');
			expect(result.active).toBe(false);
		});

		it('deve retornar SUSPENDED se a subscrição estiver suspensa', async () => {
			(prisma.subscription.findUnique as any).mockResolvedValue({ status: 'SUSPENDED' });

			const result = await SubscriptionService.checkSubscriptionStatus('org-1');

			expect(result.status).toBe('SUSPENDED');
			expect(result.active).toBe(false);
		});

		it('deve retornar EXPIRED se a data for no passado e não for TRIAL', async () => {
			const pastDate = new Date();
			pastDate.setFullYear(pastDate.getFullYear() - 1);

			(prisma.subscription.findUnique as any).mockResolvedValue({
				status: 'ACTIVE',
				endDate: pastDate
			});

			const result = await SubscriptionService.checkSubscriptionStatus('org-1');

			expect(result.status).toBe('EXPIRED');
			expect(result.active).toBe(false);
		});

		it('deve retornar ativo e o status se tudo estiver correto', async () => {
			const futureDate = new Date();
			futureDate.setFullYear(futureDate.getFullYear() + 1);

			const mockSubscription = {
				status: 'ACTIVE',
				endDate: futureDate,
				plan: { name: 'Pro' }
			};
			(prisma.subscription.findUnique as any).mockResolvedValue(mockSubscription);

			const result = await SubscriptionService.checkSubscriptionStatus('org-1');

			expect(result.active).toBe(true);
			expect(result.status).toBe('ACTIVE');
			expect(result.plan).toBeDefined();
		});
	});

	describe('isModuleEnabled', () => {
		it('deve retornar true se o módulo estiver ativo para a organização', async () => {
			(prisma.organizationModule.findFirst as any).mockResolvedValue({ isActive: true });

			const result = await SubscriptionService.isModuleEnabled('org-1', 'billing');

			expect(result).toBe(true);
		});

		it('deve retornar false se o módulo não for encontrado', async () => {
			(prisma.organizationModule.findFirst as any).mockResolvedValue(null);

			const result = await SubscriptionService.isModuleEnabled('org-1', 'billing');

			expect(result).toBe(false);
		});
	});

	describe('useActivationCode', () => {
		it('deve lançar erro se o código não existir ou for usado', async () => {
			(prisma.activationCode.findFirst as any).mockResolvedValue(null);

			await expect(SubscriptionService.useActivationCode('org-1', 'INV123'))
				.rejects.toThrow('Código de ativação inválido');
		});

		it('deve lançar erro se o código expirar', async () => {
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 1);

			(prisma.activationCode.findFirst as any).mockResolvedValue({
				expiresAt: pastDate
			});

			await expect(SubscriptionService.useActivationCode('org-1', 'EXP123'))
				.rejects.toThrow('expirou');
		});

		it('deve ativar a subscrição com o código válido', async () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 10);

			const mockCode = {
				id: 'code-1',
				planId: 'plan-1',
				expiresAt: futureDate,
				plan: { name: 'Pro', modules: [{ moduleId: 'mod-1' }] }
			};

			(prisma.activationCode.findFirst as any).mockResolvedValue(mockCode);
			(prisma.subscription.upsert as any).mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' });

			const result = await SubscriptionService.useActivationCode('org-1', 'VAL123');

			expect(result.subscription.status).toBe('ACTIVE');
			expect(prisma.subscription.upsert).toHaveBeenCalled();
			expect(prisma.organizationModule.upsert).toHaveBeenCalled();
			expect(prisma.activationCode.update).toHaveBeenCalledWith({
				where: { id: 'code-1' },
				data: expect.objectContaining({ isUsed: true })
			});
		});
	});

	describe('changeSubscriptionPlan', () => {
		it('deve atualizar o plano e provisionar módulos', async () => {
			const mockSubscription = { organizationId: 'org-1', organization: { name: 'Test' }, plan: { name: 'Old' } };
			const mockPlan = { id: 'plan-2', name: 'New Plan', modules: [{ moduleId: 'mod-2' }] };

			(prisma.subscription.findUnique as any).mockResolvedValue(mockSubscription);
			(prisma.plan.findUnique as any).mockResolvedValue(mockPlan);
			(prisma.subscription.update as any).mockResolvedValue({ status: 'ACTIVE' });

			await SubscriptionService.changeSubscriptionPlan('org-1', 'plan-2');

			expect(prisma.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { organizationId: 'org-1' },
				data: expect.objectContaining({ planId: 'plan-2' })
			}));
			expect(prisma.organizationModule.updateMany).toHaveBeenCalled();
			expect(prisma.organizationModule.upsert).toHaveBeenCalled();
		});
	});

	describe('cancelSubscription', () => {
		it('deve cancelar a subscrição e desativar módulos', async () => {
			(prisma.subscription.update as any).mockResolvedValue({ organization: { name: 'Test' } });

			await SubscriptionService.cancelSubscription('org-1');

			expect(prisma.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { organizationId: 'org-1' },
				data: expect.objectContaining({ status: 'CANCELLED' })
			}));
			expect(prisma.organizationModule.updateMany).toHaveBeenCalledWith({
				where: { organizationId: 'org-1' },
				data: { isActive: false }
			});
		});
	});
});
