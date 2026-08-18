import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { movementService } from '../../../services/module/stock/movement.service.js';
import { addStockSchema, removeStockSchema, adjustStockSchema, reversalSchema } from '../../../shared/dto/stock.dto.js';

export class MovementController {
	async getMovements(req: AuthRequest, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 20;
			const productId = req.query.productId as string | undefined;
			const type = req.query.type as string | undefined;
			const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
			const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

			const result = await movementService.getMovements(productId, { 
				page, 
				pageSize, 
				type,
				startDate,
				endDate
			});
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar movimentos' });
		}
	}

	async addStock(req: AuthRequest, res: Response) {
		try {
			const validation = addStockSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const result = await movementService.addStock(req.params.id as string, validation.data);
			res.status(201).json({ data: result });
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404 
				: error.message.includes('desativado') ? 422 
				: error.message.includes('Fornecedor') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async removeStock(req: AuthRequest, res: Response) {
		try {
			const validation = removeStockSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const result = await movementService.removeStock(req.params.id as string, validation.data);
			res.status(201).json({ data: result });
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404
				: error.message.includes('insuficiente') ? 422
				: error.message.includes('desativado') ? 422
				: 500;
			res.status(status).json({ message: error.message });
		}
	}

	async adjustStock(req: AuthRequest, res: Response) {
		try {
			const validation = adjustStockSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const result = await movementService.adjustStock(req.params.id as string, validation.data);
			res.status(201).json({ data: result });
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404
				: error.message.includes('inválido') ? 422
				: error.message.includes('desativado') ? 422
				: 500;
			res.status(status).json({ message: error.message });
		}
	}

	async reverseMovement(req: AuthRequest, res: Response) {
		try {
			const validation = reversalSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const result = await movementService.reverseMovement(
				req.params.id as string,
				validation.data.reason
			);
			res.status(201).json({ data: result });
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404
				: error.message.includes('inválid') ? 422
				: error.message.includes('desativado') ? 422
				: 500;
			res.status(status).json({ message: error.message });
		}
	}
}

export const movementController = new MovementController();
