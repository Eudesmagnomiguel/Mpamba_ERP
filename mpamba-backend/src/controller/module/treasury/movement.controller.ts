import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { movementService } from '../../../services/module/treasury/movement.service.js';
import { addMovementSchema, transferSchema } from '../../../shared/dto/treasury.dto.js';

export class MovementController {
	async addIncome(req: AuthRequest, res: Response) {
		try {
			const validation = addMovementSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const movement = await movementService.addIncome(validation.data);
			res.status(201).json({ data: movement });
		} catch (error: any) {
			res.status(422).json({ message: error.message });
		}
	}

	async addExpense(req: AuthRequest, res: Response) {
		try {
			const validation = addMovementSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const movement = await movementService.addExpense(validation.data);
			res.status(201).json({ data: movement });
		} catch (error: any) {
			res.status(422).json({ message: error.message });
		}
	}

	async transfer(req: AuthRequest, res: Response) {
		try {
			const validation = transferSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const result = await movementService.transfer(validation.data);
			res.json({ data: result });
		} catch (error: any) {
			res.status(422).json({ message: error.message });
		}
	}

	async getMovements(req: AuthRequest, res: Response) {
		try {
			const { accountId, type, startDate, endDate, page, pageSize } = req.query;
			const result = await movementService.getMovements({
				accountId: accountId as string,
				type: type as any,
				startDate: startDate ? new Date(startDate as string) : undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
				page: page ? parseInt(page as string) : undefined,
				pageSize: pageSize ? parseInt(pageSize as string) : undefined,
			});
			res.json({ data: result });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async verifyIntegrity(req: AuthRequest, res: Response) {
		try {
			const result = await movementService.verifyIntegrity(req.params.id as string);
			res.json({ data: result });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}
}

export const movementController = new MovementController();
