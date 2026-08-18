import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { payableService } from '../../../services/module/treasury/payable.service.js';

export class PayableController {
	async createPayable(req: AuthRequest, res: Response) {
		try {
			const payable = await payableService.createPayable(req.body);
			res.status(201).json({ data: payable });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async getPayables(req: AuthRequest, res: Response) {
		try {
			const status = req.query.status as any;
			const payables = await payableService.getPayables(status);
			res.json({ data: payables });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async markAsPaid(req: AuthRequest, res: Response) {
		try {
			const payable = await payableService.markAsPaid(req.params.id as string);
			res.json({ data: payable });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async deletePayable(req: AuthRequest, res: Response) {
		try {
			await payableService.deletePayable(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}
}

export const payableController = new PayableController();
