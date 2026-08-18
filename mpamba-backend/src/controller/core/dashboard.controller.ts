import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { DashboardStatsService } from '../../services/core/dashboard-stats.service.js';

export class DashboardController {
	static async getStats(req: AuthRequest, res: Response) {
		try {
			const roles = req.user?.roles || [];
			const isSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('Super Administrador');
			if (!isSuperAdmin) {
				return res.status(403).json({ message: 'Apenas Super Admin pode aceder a estatísticas globais' });
			}

			const data = await DashboardStatsService.getStats();
			return res.json({ data });
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao obter estatísticas do dashboard' });
		}
	}
}
