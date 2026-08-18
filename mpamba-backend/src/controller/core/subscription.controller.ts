import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { SubscriptionService } from '../../services/core/subscription.service.js';

export class SubscriptionController {
	/**
	 * Consulta o estado atual da subscrição da organização logada
	 */
	async getMySubscription(req: AuthRequest, res: Response) {
		try {
			const orgId = req.user?.organizationId;
			if (!orgId) return res.status(403).json({ message: 'Organização não identificada.' });

			const status = await SubscriptionService.checkSubscriptionStatus(orgId);
			res.json({ data: status });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	/**
	 * Resgata um código de ativação para fazer upgrade ou renovar
	 */
	async redeemCode(req: AuthRequest, res: Response) {
		try {
			const { code } = req.body;
			const orgId = req.user?.organizationId;

			if (!orgId) return res.status(403).json({ message: 'Apenas administradores de organização podem resgatar códigos.' });
			if (!code) return res.status(400).json({ message: 'Código de ativação é obrigatório.' });

			const result = await SubscriptionService.useActivationCode(orgId, code);

			res.json({ 
				message: `Sucesso! Seu plano foi atualizado para ${result.plan}.`,
				data: result 
			});
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Lista todas as subscrições
	 */
	async getAllSubscriptions(req: AuthRequest, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 10;
			const status = req.query.status as string | undefined;
			const organizationName = req.query.organizationName as string | undefined;

			const result = await SubscriptionService.getAllSubscriptions({
				page,
				pageSize,
				status,
				organizationName
			});

			res.json({
				status: 'success',
				data: result.data,
				pagination: result.pagination
			});
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Pega subscrição de uma organização
	 */
	async getSubscriptionByOrganizationId(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.params.organizationId as string;

			if (!organizationId) {
				return res.status(400).json({ message: 'Organization ID é obrigatório' });
			}

			const subscription = await SubscriptionService.getSubscriptionByOrganizationId(organizationId);

			res.json({
				status: 'success',
				data: subscription
			});
		} catch (error: any) {
			res.status(error.message.includes('não encontrada') ? 404 : 500).json({ message: error.message });
		}
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Suspende a subscrição
	 */
	async suspendSubscription(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.params.organizationId as string;
			const { reason } = req.body;

			if (!organizationId) {
				return res.status(400).json({ message: 'Organization ID é obrigatório' });
			}

			const result = await SubscriptionService.suspendSubscription(organizationId, reason);

			res.json({
				status: 'success',
				message: 'Subscrição suspensa com sucesso',
				data: result
			});
		} catch (error: any) {
			res.status(error.message.includes('não encontrada') ? 404 : 500).json({ message: error.message });
		}
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Reativa uma subscrição
	 */
	async resumeSubscription(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.params.organizationId as string;

			if (!organizationId) {
				return res.status(400).json({ message: 'Organization ID é obrigatório' });
			}

			const result = await SubscriptionService.resumeSubscription(organizationId);

			res.json({
				status: 'success',
				message: 'Subscrição reativada com sucesso',
				data: result
			});
		} catch (error: any) {
			res.status(error.message.includes('não encontrada') ? 404 : 500).json({ message: error.message });
		}
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Estende a subscrição
	 */
	async extendSubscription(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.params.organizationId as string;
			const { months } = req.body;

			if (!organizationId) {
				return res.status(400).json({ message: 'Organization ID é obrigatório' });
			}

			if (!months || months <= 0) {
				return res.status(400).json({ message: 'Número de meses deve ser maior que 0' });
			}

			const result = await SubscriptionService.extendSubscription(organizationId, months);

			res.json({
				status: 'success',
				message: `Subscrição estendida por ${months} mês(es)`,
				data: result
			});
		} catch (error: any) {
			res.status(error.message.includes('não encontrada') ? 404 : 500).json({ message: error.message });
		}
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Marca a subscrição como expirada
	 */
	async expireSubscription(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.params.organizationId as string;

			if (!organizationId) {
				return res.status(400).json({ message: 'Organization ID é obrigatório' });
			}

			const result = await SubscriptionService.expireSubscription(organizationId);

			res.json({
				status: 'success',
				message: 'Subscrição marcada como expirada',
				data: result
			});
		} catch (error: any) {
			res.status(error.message.includes('não encontrada') ? 404 : 500).json({ message: error.message });
		}
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Muda o plano da subscrição
	 */
	async changeSubscriptionPlan(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.params.organizationId as string;
			const { planId } = req.body;

			if (!organizationId) {
				return res.status(400).json({ message: 'Organization ID é obrigatório' });
			}

			if (!planId) {
				return res.status(400).json({ message: 'Plan ID é obrigatório' });
			}

			const result = await SubscriptionService.changeSubscriptionPlan(organizationId, planId);

			res.json({
				status: 'success',
				message: 'Plano alterado com sucesso',
				data: result
			});
		} catch (error: any) {
			res.status(error.message.includes('não encontrada') ? 404 : 500).json({ message: error.message });
		}
	}

	/**
	 * 👨‍💼 SUPER ADMIN - Cancela a subscrição
	 */
	async cancelSubscription(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.params.organizationId as string;
			const { reason } = req.body;

			if (!organizationId) {
				return res.status(400).json({ message: 'Organization ID é obrigatório' });
			}

			const result = await SubscriptionService.cancelSubscription(organizationId, reason);

			res.json({
				status: 'success',
				message: 'Subscrição cancelada com sucesso',
				data: result
			});
		} catch (error: any) {
			res.status(error.message.includes('não encontrada') ? 404 : 500).json({ message: error.message });
		}
	}
}

export const subscriptionController = new SubscriptionController();
