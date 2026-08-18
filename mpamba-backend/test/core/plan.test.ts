import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanService } from '../../src/services/core/plan.service.js';
import { prisma } from '../../src/config/prisma.config.js';

// Mocking prisma
vi.mock('../../src/config/prisma.config.js', () => ({
	prisma: {
		plan: {
			findMany: vi.fn(),
			count: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		planModule: {
			createMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		organization: {
			count: vi.fn(),
		},
		$transaction: vi.fn((callback) => callback(prisma)),
	},
}));

describe('PlanService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('listPlans', () => {
		it('deve listar planos com paginação', async () => {
			const mockPlans = [{ id: 'plan-1', name: 'Pro' }];
			(prisma.plan.findMany as any).mockResolvedValue(mockPlans);
			(prisma.plan.count as any).mockResolvedValue(1);

			const result = await PlanService.listPlans({ page: 1, pageSize: 10 });

			expect(result.data).toEqual(mockPlans);
			expect(result.pagination.total).toBe(1);
			expect(result.pagination.totalPages).toBe(1);
		});
	});

	describe('getPlanByCode', () => {
		it('deve retornar um plano pelo código', async () => {
			const mockPlan = { id: 'plan-1', code: 'PRO' };
			(prisma.plan.findFirst as any).mockResolvedValue(mockPlan);

			const result = await PlanService.getPlanByCode('PRO');

			expect(result).toEqual(mockPlan);
			expect(prisma.plan.findFirst).toHaveBeenCalledWith(expect.objectContaining({
				where: { OR: [{ code: 'PRO' }, { id: 'PRO' }] }
			}));
		});

		it('deve retornar um plano pelo id', async () => {
			const mockPlan = { id: 'plan-1', code: 'PRO' };
			(prisma.plan.findFirst as any).mockResolvedValue(mockPlan);

			const result = await PlanService.getPlanByCode('plan-1');

			expect(result).toEqual(mockPlan);
			expect(prisma.plan.findFirst).toHaveBeenCalledWith(expect.objectContaining({
				where: { OR: [{ code: 'plan-1' }, { id: 'plan-1' }] }
			}));
		});
	});

	describe('createPlan', () => {
		it('deve criar um plano e associar módulos', async () => {
			const planData = { name: 'Pro', price: 100, moduleIds: ['mod-1', 'mod-2'] };
			const createdPlan = { id: 'plan-1', name: 'Pro' };

			(prisma.plan.create as any).mockResolvedValue(createdPlan);
			(prisma.plan.findUnique as any).mockResolvedValue(createdPlan);

			const result = await PlanService.createPlan(planData);

			expect(prisma.plan.create).toHaveBeenCalledWith({
				data: { name: 'Pro', price: 100 }
			});
			expect(prisma.planModule.createMany).toHaveBeenCalledWith({
				data: [
					{ planId: 'plan-1', moduleId: 'mod-1' },
					{ planId: 'plan-1', moduleId: 'mod-2' }
				]
			});
			expect(result).toEqual(createdPlan);
		});
	});

	describe('updatePlan', () => {
		it('deve atualizar um plano e suas associações de módulos', async () => {
			const updateData = { name: 'Pro Updated', moduleIds: ['mod-3'] };
			const updatedPlan = { id: 'plan-1', name: 'Pro Updated' };

			(prisma.plan.update as any).mockResolvedValue(updatedPlan);
			(prisma.plan.findUnique as any).mockResolvedValue(updatedPlan);

			const result = await PlanService.updatePlan('plan-1', updateData);

			expect(prisma.plan.update).toHaveBeenCalledWith({
				where: { id: 'plan-1' },
				data: { name: 'Pro Updated' }
			});
			expect(prisma.planModule.deleteMany).toHaveBeenCalledWith({
				where: { planId: 'plan-1' }
			});
			expect(prisma.planModule.createMany).toHaveBeenCalledWith({
				data: [
					{ planId: 'plan-1', moduleId: 'mod-3' }
				]
			});
			expect(result).toEqual(updatedPlan);
		});
	});

	describe('deletePlan', () => {
		it('deve deletar um plano se não estiver em uso', async () => {
			(prisma.organization.count as any).mockResolvedValue(0);

			await PlanService.deletePlan('plan-1');

			expect(prisma.planModule.deleteMany).toHaveBeenCalledWith({
				where: { planId: 'plan-1' }
			});
			expect(prisma.plan.delete).toHaveBeenCalledWith({
				where: { id: 'plan-1' }
			});
		});

		it('deve lançar erro se o plano estiver em uso', async () => {
			(prisma.organization.count as any).mockResolvedValue(1);

			await expect(PlanService.deletePlan('plan-1')).rejects.toThrow('sendo usado por organizações');
		});
	});
});
