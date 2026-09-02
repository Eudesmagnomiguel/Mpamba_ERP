import type { Response } from 'express';
import type { ZodError } from 'zod';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { movementService } from '../../../services/module/treasury/movement.service.js';
import { addMovementSchema, createMovementSchema, transferSchema } from '../../../shared/dto/treasury.dto.js';

/**
 * Devolve o erro de validação com uma `message` legível, para que o frontend
 * possa mostrar a causa real em vez de uma mensagem genérica.
 */
function validationError(res: Response, error: ZodError) {
	const first = error.issues[0];
	return res.status(400).json({
		message: first ? `${first.path.join('.') || 'dados'}: ${first.message}` : 'Dados inválidos',
		errors: error.format(),
	});
}

export class MovementController {
	async createMovement(req: AuthRequest, res: Response) {
		try {
			const validation = createMovementSchema.safeParse(req.body);
			if (!validation.success) {
				return validationError(res, validation.error);
			}

			const movement = await movementService.createMovement(validation.data);
			res.status(201).json({ data: movement });
		} catch (error: any) {
			res.status(422).json({ message: error.message });
		}
	}

	async addIncome(req: AuthRequest, res: Response) {
		try {
			const validation = addMovementSchema.safeParse(req.body);
			if (!validation.success) {
				return validationError(res, validation.error);
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
				return validationError(res, validation.error);
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
				return validationError(res, validation.error);
			}

			const result = await movementService.transfer(validation.data);
			res.status(201).json({ data: result });
		} catch (error: any) {
			res.status(422).json({ message: error.message });
		}
	}

	async getMovements(req: AuthRequest, res: Response) {
		try {
			const { accountId, type, categoryId, startDate, endDate, page, pageSize } = req.query;
			const result = await movementService.getMovements({
				accountId: accountId as string,
				type: type as any,
				categoryId: categoryId as string,
				startDate: startDate ? new Date(startDate as string) : undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
				page: page ? parseInt(page as string) : undefined,
				pageSize: pageSize ? parseInt(pageSize as string) : undefined,
			});

			const totalPages = result.pageSize > 0 ? Math.ceil(result.total / result.pageSize) : 0;

			res.json({
				data: result.items,
				pagination: {
					page: result.page,
					pageSize: result.pageSize,
					total: result.total,
					totalPages,
					hasNextPage: result.page < totalPages,
					hasPreviousPage: result.page > 1,
				},
			});
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getMovementById(req: AuthRequest, res: Response) {
		try {
			const movement = await movementService.getMovementById(req.params.id as string);
			res.json({ data: movement });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}

	async deleteMovement(req: AuthRequest, res: Response) {
		try {
			await movementService.deleteMovement(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			res.status(422).json({ message: error.message });
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
