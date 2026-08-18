/**
 * @fileoverview Rotas de estatísticas do dashboard administrativo
 */

import { Router } from 'express';
import { DashboardController } from '../../controller/core/dashboard.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { permissionGuard } from '../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../shared/utils/rbac/permission.constants.js';
import { cacheMiddleware } from '../../middleware/cache.middleware.js';

const router = Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Estatísticas globais do painel administrativo (Super Admin)
 *     description: Retorna totais cross-organização (organizações, utilizadores ativos, MRR, conversão), crescimento mensal e distribuição de planos.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *       403:
 *         description: Apenas Super Admin pode aceder
 */
router.get(
	'/stats',
	authMiddleware as any,
	permissionGuard(PERMISSIONS.DASHBOARD_VIEW) as any,
	cacheMiddleware(120, 'dashboard:'),
	(req, res) => DashboardController.getStats(req as any, res)
);

export default router;
