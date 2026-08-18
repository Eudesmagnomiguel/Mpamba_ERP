import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { seriesService } from '../../../services/module/billing/series.service.js';

export class SeriesController {
	async createSeries(req: AuthRequest, res: Response) {
		try {
			const series = await seriesService.createSeries(req.body);
			res.status(201).json({ data: series });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getSeries(req: AuthRequest, res: Response) {
		try {
			const series = await seriesService.getSeries();
			res.json({ data: series });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}
}

export const seriesController = new SeriesController();
