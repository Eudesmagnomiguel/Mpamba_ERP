import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService, PlanNotFoundError } from '../../src/services/module/organization.services.js';
import { prisma } from '../../src/config/prisma.config.js';

const tx: any = {
	organization: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
	subscription: { upsert: vi.fn(), findUnique: vi.fn() },
	organizationModule: { updateMany: vi.fn(), upsert: vi.fn() },
	plan: { findUnique: vi.fn() },
};

vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		$transaction: vi.fn(),
		organization: { findUnique: vi.fn() },
		organizationModule: { upsert: vi.fn(), updateMany: vi.fn() },
	},
}));

const PLAN_PREMIUM = {
	id: 'plan-premium',
	name: 'Premium',
	modules: [
		{ moduleId: 'mod-billing' },
		{ moduleId: 'mod-stock' },
		{ moduleId: 'mod-tesouraria' },
	],
};

describe('OrganizationService — provisionamento do plano', () => {
	let service: OrganizationService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new OrganizationService();
		(prisma.$transaction as any).mockImplementation((fn: any) => fn(tx));
		(prisma.organization.findUnique as any).mockResolvedValue(null);
		tx.plan.findUnique.mockResolvedValue(PLAN_PREMIUM);
		tx.organization.create.mockResolvedValue({ id: 'org-1', name: 'Empresa', planId: 'plan-premium' });
		tx.organization.update.mockResolvedValue({ id: 'org-1', name: 'Empresa', planId: 'plan-premium' });
		tx.organization.findUnique.mockResolvedValue({ planId: null });
		tx.subscription.findUnique.mockResolvedValue(null);
	});

	it('cria a subscrição e ativa os módulos do plano ao criar a organização', async () => {
		await service.create({ name: 'Empresa', planId: 'plan-premium' } as any);

		expect(tx.subscription.upsert).toHaveBeenCalledTimes(1);
		const upsertArgs = tx.subscription.upsert.mock.calls[0][0];
		expect(upsertArgs.where).toEqual({ organizationId: 'org-1' });
		expect(upsertArgs.create.planId).toBe('plan-premium');
		expect(upsertArgs.create.status).toBe('ACTIVE');

		// Desativa tudo antes de reativar só o que o plano inclui
		expect(tx.organizationModule.updateMany).toHaveBeenCalledWith({
			where: { organizationId: 'org-1' },
			data: { isActive: false },
		});
		expect(tx.organizationModule.upsert).toHaveBeenCalledTimes(3);
		const activatedModuleIds = tx.organizationModule.upsert.mock.calls.map((c: any) => c[0].create.moduleId);
		expect(activatedModuleIds).toEqual(['mod-billing', 'mod-stock', 'mod-tesouraria']);
		expect(tx.organizationModule.upsert.mock.calls[0][0].create.isActive).toBe(true);
	});

	it('não provisiona quando a organização é criada sem plano', async () => {
		tx.organization.create.mockResolvedValue({ id: 'org-1', name: 'Empresa', planId: null });

		await service.create({ name: 'Empresa' } as any);

		expect(tx.subscription.upsert).not.toHaveBeenCalled();
		expect(tx.organizationModule.upsert).not.toHaveBeenCalled();
	});

	it('recusa um plano inexistente', async () => {
		tx.plan.findUnique.mockResolvedValue(null);

		await expect(
			service.create({ name: 'Empresa', planId: 'plano-que-nao-existe' } as any)
		).rejects.toBeInstanceOf(PlanNotFoundError);
	});

	it('reprovisiona quando o plano muda (starter -> premium)', async () => {
		tx.organization.findUnique.mockResolvedValue({ planId: 'plan-starter' });
		tx.subscription.findUnique.mockResolvedValue({ id: 'sub-1' });

		await service.update('org-1', { planId: 'plan-premium' } as any);

		expect(tx.subscription.upsert).toHaveBeenCalledTimes(1);
		expect(tx.organizationModule.upsert).toHaveBeenCalledTimes(3);
	});

	it('repara organizações que ficaram com plano mas sem subscrição', async () => {
		tx.organization.findUnique.mockResolvedValue({ planId: 'plan-premium' });
		tx.subscription.findUnique.mockResolvedValue(null);

		await service.update('org-1', { planId: 'plan-premium' } as any);

		expect(tx.subscription.upsert).toHaveBeenCalledTimes(1);
		expect(tx.organizationModule.upsert).toHaveBeenCalledTimes(3);
	});

	it('não renova a subscrição quando se guarda o formulário sem mudar o plano', async () => {
		tx.organization.findUnique.mockResolvedValue({ planId: 'plan-premium' });
		tx.subscription.findUnique.mockResolvedValue({ id: 'sub-1' });

		await service.update('org-1', { phone: '900000000', planId: 'plan-premium' } as any);

		expect(tx.subscription.upsert).not.toHaveBeenCalled();
		expect(tx.organizationModule.updateMany).not.toHaveBeenCalled();
	});

	it('não toca na subscrição quando a organização edita os seus próprios dados', async () => {
		tx.organization.findUnique.mockResolvedValue({ planId: 'plan-premium' });
		tx.subscription.findUnique.mockResolvedValue({ id: 'sub-1' });

		await service.update('org-1', { name: 'Novo Nome' } as any);

		expect(tx.subscription.upsert).not.toHaveBeenCalled();
	});
});

describe('OrganizationService — módulos avulso', () => {
	let service: OrganizationService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new OrganizationService();
	});

	it('reativa um módulo já existente em vez de rebentar com chave duplicada', async () => {
		(prisma.organizationModule.upsert as any).mockResolvedValue({ isActive: true });

		await service.assignModule('org-1', 'mod-stock');

		expect(prisma.organizationModule.upsert).toHaveBeenCalledWith({
			where: { organizationId_moduleId: { organizationId: 'org-1', moduleId: 'mod-stock' } },
			update: { isActive: true },
			create: { organizationId: 'org-1', moduleId: 'mod-stock', isActive: true },
		});
	});

	it('desativa o módulo em vez de apagar a linha', async () => {
		(prisma.organizationModule.updateMany as any).mockResolvedValue({ count: 1 });

		await service.removeModule('org-1', 'mod-stock');

		expect(prisma.organizationModule.updateMany).toHaveBeenCalledWith({
			where: { organizationId: 'org-1', moduleId: 'mod-stock' },
			data: { isActive: false },
		});
	});
});
