import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';
import { SubscriptionService } from '../services/core/subscription.service.js';

/**
 * Guard de Módulo
 * Verifica se a organização tem permissão contratual para usar o módulo (ex: 'stock')
 */
export const moduleGuard = (moduleCode: string) => {
	return async (req: AuthRequest, res: Response, next: NextFunction) => {
		const orgId = req.user?.organizationId;

		// Super Admins (no organizationId) bypass the module check
		if (!orgId) return next();

		const isEnabled = await SubscriptionService.isModuleEnabled(orgId, moduleCode);

		if (!isEnabled) {
			return res.status(403).json({
				status: 'error',
				message: `O módulo '${moduleCode}' não está ativo para a sua organização. Contacte o administrador para fazer o upgrade do seu plano.`,
				code: 'MODULE_LOCKED'
			});
		}

		next();
	};
};

/**
 * Guard de Subscrição Ativa
 * Verifica se a subscrição não está expirada ou suspensa.
 * Permite leitura (GET) mas bloqueia escrita (POST, PUT, DELETE, PATCH) se estiver inativa.
 */
export const subscriptionGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const orgId = req.user?.organizationId;

	if (!orgId) return next(); // Deixa passar se não tiver org (ex: Super Admin)

	const subStatus = await SubscriptionService.checkSubscriptionStatus(orgId);

	if (!subStatus.active) {
		// Se for uma tentativa de alteração de dados (escrita)
		if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
			return res.status(402).json({
				status: 'error',
				message: subStatus.message,
				code: 'SUBSCRIPTION_REQUIRED',
				currentStatus: subStatus.status
			});
		}
	}

	next();
};
