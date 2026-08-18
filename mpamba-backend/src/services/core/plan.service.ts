import { prisma } from '../../config/prisma.config.js';

export class PlanService {
	static async listPlans(paginationOptions?: { page?: number; pageSize?: number }) {
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 10;
		const skip = (page - 1) * pageSize;

		const [data, total] = await Promise.all([
			prisma.plan.findMany({
				include: {
					modules: {
						include: {
							module: true
						}
					}
				},
				orderBy: {
					price: 'asc'
				},
				skip,
				take: pageSize
			}),
			prisma.plan.count()
		]);

		const totalPages = Math.ceil(total / pageSize);

		return {
			data,
			pagination: {
				page,
				pageSize,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1
			}
		};
	}

	/**
	 * Busca um plano pelo `code` ou pelo `id` — a listagem de planos navega
	 * para a edição usando o `id`, mas esta rota historicamente só aceitava `code`.
	 */
	static async getPlanByCode(codeOrId: string) {
		return prisma.plan.findFirst({
			where: {
				OR: [{ code: codeOrId }, { id: codeOrId }]
			},
			include: {
				modules: {
					include: {
						module: true
					}
				}
			}
		});
	}

	static async createPlan(data: any) {
		const { moduleIds, ...planData } = data;

	return prisma.$transaction(async (tx: any) => {
			const plan = await tx.plan.create({
				data: planData
			});

			if (moduleIds && moduleIds.length > 0) {
				await tx.planModule.createMany({
					data: moduleIds.map((moduleId: string) => ({
						planId: plan.id,
						moduleId
					}))
				});
			}

			return tx.plan.findUnique({
				where: { id: plan.id },
				include: { modules: { include: { module: true } } }
			});
		});
	}

	static async updatePlan(id: string, data: any) {
		const { moduleIds, ...planData } = data;

	return prisma.$transaction(async (tx: any) => {
			const plan = await tx.plan.update({
				where: { id },
				data: planData
			});

			if (moduleIds !== undefined) {
				// Delete existing relationships
				await tx.planModule.deleteMany({
					where: { planId: id }
				});

				// Create new ones
				if (moduleIds.length > 0) {
					await tx.planModule.createMany({
						data: moduleIds.map((moduleId: string) => ({
							planId: id,
							moduleId
						}))
					});
				}
			}

			return tx.plan.findUnique({
				where: { id },
				include: { modules: { include: { module: true } } }
			});
		});
	}

	static async deletePlan(id: string) {
	return prisma.$transaction(async (tx: any) => {
			// Check if any organization is using this plan
			const orgCount = await tx.organization.count({
				where: { planId: id }
			});

			if (orgCount > 0) {
				throw new Error('Não é possível excluir um plano que está sendo usado por organizações');
			}

			// Delete relationships first
			await tx.planModule.deleteMany({
				where: { planId: id }
			});

			// Delete activation codes related to organizations using this plan (if any)
			// But since we checked orgCount > 0, we don't need to worrry about that here.

			return tx.plan.delete({
				where: { id }
			});
		});
	}
}