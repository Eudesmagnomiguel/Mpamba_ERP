import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { posService } from '../../../services/module/billing/pos.service.js';
import { posCheckoutSchema } from '../../../shared/dto/pos.dto.js';

export class PosController {
	static async checkout(req: AuthRequest, res: Response) {
		try {
			const parsed = posCheckoutSchema.parse(req.body);
			const result = await posService.checkout(parsed);
			return res.status(201).json({ data: result });
		} catch (error: any) {
			if (error.name === 'ZodError') {
				return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
			}
			return res.status(400).json({ message: error.message || 'Erro ao finalizar venda' });
		}
	}
}
