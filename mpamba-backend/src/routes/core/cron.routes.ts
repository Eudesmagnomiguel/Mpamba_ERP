/**
 * @fileoverview Rotas de tarefas agendadas
 * @description Em ambiente serverless não existe processo persistente, logo o
 * setInterval de src/server.ts nunca corre. Estas rotas são invocadas
 * externamente (Vercel Cron) para disparar as verificações periódicas.
 */

import { Router } from 'express';
import ENV from '../../shared/utils/env.utils.js';
import { AlertsService } from '../../services/core/alerts.service.js';

const router = Router();

// Só aceita chamadas com o segredo configurado. O Vercel Cron envia-o
// automaticamente no header Authorization quando CRON_SECRET está definido.
router.use((req, res, next) => {
	if (!ENV.CRON_SECRET) {
		return res.status(503).json({
			status: 'error',
			message: 'CRON_SECRET não configurado — tarefas agendadas desativadas',
		});
	}

	if (req.headers.authorization !== `Bearer ${ENV.CRON_SECRET}`) {
		return res.status(401).json({ status: 'error', message: 'Não autorizado' });
	}

	next();
});

/**
 * @swagger
 * /cron/alerts:
 *   get:
 *     tags:
 *       - Cron
 *     summary: Executa as verificações de alertas automáticos
 *     description: Faturas vencidas e saldos de tesouraria críticos. Requer o header Authorization com o CRON_SECRET.
 *     responses:
 *       200:
 *         description: Verificação concluída
 *       401:
 *         description: Não autorizado
 */
router.get('/alerts', async (req, res) => {
	try {
		await AlertsService.runChecks();
		res.json({ status: 'OK', message: 'Verificação de alertas concluída' });
	} catch (error) {
		console.error('❌ [Cron] Erro na verificação de alertas:', error);
		res.status(500).json({ status: 'error', message: 'Falha na verificação de alertas' });
	}
});

export default router;
