import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { receivableService } from '../../../services/module/treasury/receivable.service.js';

export class ReceivableController {
	async createReceivable(req: AuthRequest, res: Response) {
		try {
			const receivable = await receivableService.createReceivable(req.body);
			res.status(201).json({ data: receivable });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async getReceivables(req: AuthRequest, res: Response) {
		try {
			const status = req.query.status as any;
			const receivables = await receivableService.getReceivables(status);
			res.json({ data: receivables });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async markAsPaid(req: AuthRequest, res: Response) {
		try {
			const receivable = await receivableService.markAsPaid(req.params.id as string);
			res.json({ data: receivable });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async deleteReceivable(req: AuthRequest, res: Response) {
		try {
			await receivableService.deleteReceivable(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}
}

export const receivableController = new ReceivableController();
