import { prisma } from '../../config/prisma.config.js';
import { NotificationService } from './notification.service.js';

export class SubscriptionService {
	/**
	 * Verifica se a organização tem uma subscrição válida para operar.
	 * Regra: Leitura pode ser permitida, Escrita bloqueada se não estiver ACTIVE ou TRIAL.
	 */
	static async checkSubscriptionStatus(organizationId: string) {
		const subscription = await prisma.subscription.findUnique({
			where: { organizationId },
			include: { plan: true }
		});

		if (!subscription) return { active: false, status: 'NONE', message: 'Nenhuma subscrição encontrada.' };

		const now = new Date();
		const isExpired = subscription.endDate ? subscription.endDate < now : false;

		// Módulos realmente ativos para a organização — o plano tem uma lista
		// "nominal" de módulos incluídos, mas um admin pode ativar módulos
		// adicionais diretamente na organização, por isso o total mostrado ao
		// utilizador tem de vir de OrganizationModule, não do template do plano.
		const orgModules = subscription.plan
			? await prisma.organizationModule.findMany({
					where: { organizationId, isActive: true },
					include: { module: true },
				})
			: [];

		const plan = subscription.plan && {
			...subscription.plan,
			modules: orgModules
				.filter((om) => om.module)
				.map((om) => ({ id: om.module.id, code: om.module.code, name: om.module.name })),
		};

		if (subscription.status === 'SUSPENDED') {
			return { active: false, status: 'SUSPENDED', message: 'Subscrição suspensa por falta de pagamento.' };
		}

		if (isExpired && subscription.status !== 'TRIAL') {
			return { active: false, status: 'EXPIRED', message: 'Sua subscrição expirou. Faça o upgrade para continuar.' };
		}

		return { active: true, status: subscription.status, plan, endDate: subscription.endDate };
	}

	/**
	 * Verifica se um módulo específico está ativo para a organização.
	 */
	static async isModuleEnabled(organizationId: string, moduleCode: string): Promise<boolean> {
		const orgModule = await prisma.organizationModule.findFirst({
			where: {
				organizationId,
				module: { code: moduleCode },
				isActive: true
			}
		});

		return !!orgModule;
	}

	/**
	 * 🎟️ Usa um código de ativação para atualizar/ativar uma subscrição
	 */
	static async useActivationCode(organizationId: string, code: string) {
		return prisma.$transaction(async (tx) => {
			// 1. Validar o código
			const activationCode = await tx.activationCode.findFirst({
				where: { 
					code, 
					isUsed: false,
				},
				include: { 
					plan: { 
						include: { 
							modules: { include: { module: true } } 
						} 
					} 
				}
			});

			if (!activationCode) throw new Error('Código de ativação inválido ou já utilizado.');
			
			// Validar se o código era específico para outra organização
			if (activationCode.organizationId && activationCode.organizationId !== organizationId) {
				throw new Error('Este código de ativação não pertence à sua organização.');
			}

			if (activationCode.expiresAt < new Date()) throw new Error('Este código de ativação expirou.');

			const plan = (activationCode as any).plan;

			// 2. Atualizar a Subscrição
			const months = 12; // Exemplo: códigos valem 1 ano
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + months);

			const subscription = await tx.subscription.upsert({
				where: { organizationId },
				update: {
					planId: activationCode.planId,
					status: 'ACTIVE',
					endDate,
					startDate: new Date(),
				},
				create: {
					organizationId,
					planId: activationCode.planId,
					status: 'ACTIVE',
					endDate,
					startDate: new Date(),
				}
			});

			// 2.1 Manter `Organization.planId` em sincronia com a subscrição: é de
			// lá que a lista do backoffice lê a coluna "Plano".
			await tx.organization.update({
				where: { id: organizationId },
				data: { planId: activationCode.planId }
			});

			// 3. Ativar/Atualizar Módulos da Organização baseados no Plano
			await tx.organizationModule.updateMany({
				where: { organizationId },
				data: { isActive: false }
			});

			for (const planModule of plan.modules) {
				await tx.organizationModule.upsert({
					where: {
						organizationId_moduleId: {
							organizationId,
							moduleId: planModule.moduleId
						}
					},
					update: { isActive: true },
					create: {
						organizationId,
						moduleId: planModule.moduleId,
						isActive: true
					}
				});
			}

			// 4. Marcar código como usado
			await tx.activationCode.update({
				where: { id: activationCode.id },
				data: { 
					isUsed: true, 
					usedAt: new Date(),
					organizationId
				}
			});

			return { subscription, plan: plan.name };
		});
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Lista todas as subscrições com filtros e paginação
	 */
	static async getAllSubscriptions(filters?: {
		page?: number;
		pageSize?: number;
		status?: string;
		organizationName?: string;
	}) {
		const page = filters?.page || 1;
		const pageSize = filters?.pageSize || 10;
		const skip = (page - 1) * pageSize;

		const whereClause: any = {};
		
		if (filters?.status) {
			if (filters.status === 'EXPIRED') {
				whereClause.endDate = { lt: new Date() };
				whereClause.status = { not: 'CANCELLED' };
			} else {
				whereClause.status = filters.status;
			}
		}

		if (filters?.organizationName) {
			whereClause.organization = {
				name: { contains: filters.organizationName, mode: 'insensitive' }
			};
		}

		const [subscriptions, total] = await Promise.all([
			prisma.subscription.findMany({
				where: whereClause,
				include: {
					organization: { select: { id: true, name: true, email: true } },
					plan: true
				},
				skip,
				take: pageSize,
				orderBy: { createdAt: 'desc' }
			}),
			prisma.subscription.count({ where: whereClause })
		]);

		return {
			data: subscriptions,
			pagination: {
				page,
				pageSize,
				total,
				totalPages: Math.ceil(total / pageSize),
				hasNextPage: page < Math.ceil(total / pageSize),
				hasPreviousPage: page > 1
			}
		};
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Pega a subscrição de uma organização específica
	 */
	static async getSubscriptionByOrganizationId(organizationId: string) {
		const subscription = await prisma.subscription.findUnique({
			where: { organizationId },
			include: {
				organization: { select: { id: true, name: true, email: true, isActive: true } },
				plan: {
					include: {
						modules: { include: { module: true } }
					}
				}
			}
		});

		if (!subscription) {
			throw new Error('Subscrição não encontrada para esta organização');
		}

		return subscription;
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Suspende a subscrição de uma organização
	 */
	static async suspendSubscription(organizationId: string, reason?: string) {
		const subscription = await prisma.subscription.update({
			where: { organizationId },
			data: {
				status: 'SUSPENDED'
			},
			include: { organization: true, plan: true }
		});

		// TODO: Enviar email de notificação para a organização
		console.log(`[Subscription] Suspended for ${subscription.organization.name}. Reason: ${reason || 'N/A'}`);

		return subscription;
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Reativa uma subscrição suspensa
	 */
	static async resumeSubscription(organizationId: string) {
		const subscription = await prisma.subscription.update({
			where: { organizationId },
			data: {
				status: 'ACTIVE'
			},
			include: { organization: true, plan: true }
		});

		// TODO: Enviar email de notificação para a organização
		console.log(`[Subscription] Resumed for ${subscription.organization.name}`);

		return subscription;
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Estende a data de expiração da subscrição
	 */
	static async extendSubscription(organizationId: string, months: number) {
		const subscription = await prisma.subscription.findUnique({
			where: { organizationId }
		});

		if (!subscription) {
			throw new Error('Subscrição não encontrada');
		}

		const newEndDate = new Date(subscription.endDate || new Date());
		newEndDate.setMonth(newEndDate.getMonth() + months);

		const updated = await prisma.subscription.update({
			where: { organizationId },
			data: {
				endDate: newEndDate,
				status: 'ACTIVE'
			},
			include: { organization: true, plan: true }
		});

		console.log(`[Subscription] Extended for ${updated.organization.name} by ${months} months. New end date: ${newEndDate}`);

		await NotificationService.notifyOrganization(organizationId, {
			title: 'Subscrição renovada',
			message: `A sua subscrição foi renovada até ${newEndDate.toLocaleDateString('pt-PT')}.`,
			type: 'SUCCESS'
		});

		return updated;
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Marca uma subscrição como expirada imediatamente
	 */
	static async expireSubscription(organizationId: string) {
		const subscription = await prisma.subscription.update({
			where: { organizationId },
			data: {
				status: 'EXPIRED',
				endDate: new Date()
			},
			include: { organization: true, plan: true }
		});

		console.log(`[Subscription] Marked as expired for ${subscription.organization.name}`);

		await NotificationService.notifyOrganization(organizationId, {
			title: 'Subscrição expirada',
			message: 'A sua subscrição foi marcada como expirada. Contacte o suporte para renovar.',
			type: 'WARNING'
		});

		return subscription;
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Muda o plano de uma subscrição
	 */
	static async changeSubscriptionPlan(organizationId: string, newPlanId: string) {
		const [subscription, newPlan, organization] = await Promise.all([
			prisma.subscription.findUnique({ where: { organizationId }, include: { organization: true, plan: true } }),
			prisma.plan.findUnique({
				where: { id: newPlanId },
				include: { modules: { include: { module: true } } }
			}),
			prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true, name: true } })
		]);

		if (!organization) {
			throw new Error('Organização não encontrada');
		}

		if (!newPlan) {
			throw new Error('Plano não encontrado');
		}

		return prisma.$transaction(async (tx) => {
			// 1. Criar ou atualizar a subscrição.
			// `upsert` e não `update`: organizações a quem foi atribuído um plano
			// no backoffice ficam com `Organization.planId` sem linha em
			// `Subscription`, e o `update` rebentava com "Subscrição não
			// encontrada" — deixando-as sem forma de receber a subscrição.
			const startDate = new Date();
			const endDate = new Date(startDate);
			endDate.setMonth(endDate.getMonth() + 12);

			const updated = await tx.subscription.upsert({
				where: { organizationId },
				update: {
					planId: newPlanId,
					status: 'ACTIVE'
				},
				create: {
					organizationId,
					planId: newPlanId,
					status: 'ACTIVE',
					startDate,
					endDate
				},
				include: { organization: true, plan: true }
			});

			// 1.1 Manter `Organization.planId` em sincronia: é de lá que a lista
			// do backoffice lê a coluna "Plano".
			await tx.organization.update({
				where: { id: organizationId },
				data: { planId: newPlanId }
			});

			// 2. Atualizar módulos da organização
			await tx.organizationModule.updateMany({
				where: { organizationId },
				data: { isActive: false }
			});

			for (const planModule of newPlan.modules) {
				await tx.organizationModule.upsert({
					where: {
						organizationId_moduleId: {
							organizationId,
							moduleId: planModule.moduleId
						}
					},
					update: { isActive: true },
					create: {
						organizationId,
						moduleId: planModule.moduleId,
						isActive: true
					}
				});
			}

			console.log(`[Subscription] Plan changed for ${organization.name} from ${subscription?.plan.name ?? 'sem plano'} to ${newPlan.name}`);

			return updated;
		}).then(async (updated) => {
			await NotificationService.notifyOrganization(organizationId, {
				title: 'Plano de subscrição alterado',
				message: `O plano da sua organização foi alterado para ${newPlan.name}.`,
				type: 'INFO'
			});
			return updated;
		});
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Cancela uma subscrição
	 */
	static async cancelSubscription(organizationId: string, reason?: string) {
		const subscription = await prisma.subscription.update({
			where: { organizationId },
			data: {
				status: 'CANCELLED',
				endDate: new Date()
			},
			include: { organization: true, plan: true }
		});

		// Desativar todos os módulos
		await prisma.organizationModule.updateMany({
			where: { organizationId },
			data: { isActive: false }
		});

		// TODO: Enviar email de notificação para a organização
		console.log(`[Subscription] Cancelled for ${subscription.organization.name}. Reason: ${reason || 'N/A'}`);

		return subscription;
	}
}
