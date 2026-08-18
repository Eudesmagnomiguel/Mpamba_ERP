import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { statsService } from '../../../services/module/billing/stats.service.js';

export class StatsController {
	async getStats(req: AuthRequest, res: Response) {
		try {
			const stats = await statsService.getStats();
			return res.status(200).json(stats);
		} catch (error: any) {
			return res.status(400).json({ message: error.message });
		}
	}
}

export const statsController = new StatsController();
