import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { cashSessionService } from '../../../services/module/treasury/cash-session.service.js';
import { openCashSessionSchema, closeCashSessionSchema } from '../../../shared/dto/treasury.dto.js';

export class CashSessionController {
	async open(req: AuthRequest, res: Response) {
		try {
			const validation = openCashSessionSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}
			const session = await cashSessionService.openSession(validation.data);
			res.status(201).json({ data: session });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async close(req: AuthRequest, res: Response) {
		try {
			const validation = closeCashSessionSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}
			const session = await cashSessionService.closeSession(req.params.id as string, validation.data);
			res.json({ data: session });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async getActive(req: AuthRequest, res: Response) {
		try {
			const session = await cashSessionService.getActiveSession(req.params.accountId as string);
			res.json({ data: session });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async list(req: AuthRequest, res: Response) {
		try {
			const { financialAccountId, status, page, pageSize } = req.query;
			const result = await cashSessionService.listSessions({
				financialAccountId: financialAccountId as string | undefined,
				status: status as 'OPEN' | 'CLOSED' | undefined,
				page: page ? parseInt(page as string) : undefined,
				pageSize: pageSize ? parseInt(pageSize as string) : undefined,
			});
			res.json(result);
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}
}

export const cashSessionController = new CashSessionController();
