import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { bankStatementService } from '../../../services/module/treasury/bank-statement.service.js';
import { createBankStatementSchema, manualMatchSchema } from '../../../shared/dto/treasury.dto.js';
import { toFriendlyErrorMessage } from '../../../shared/utils/db-error.utils.js';

export class BankStatementController {
	async create(req: AuthRequest, res: Response) {
		try {
			const validation = createBankStatementSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}
			const statement = await bankStatementService.createStatement(validation.data);
			res.status(201).json({ data: statement });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async list(req: AuthRequest, res: Response) {
		try {
			const statements = await bankStatementService.listStatements();
			res.json({ data: statements });
		} catch (error: any) {
			console.error('[BankStatement] Falha ao listar extratos:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao carregar os extratos') });
		}
	}

	async getById(req: AuthRequest, res: Response) {
		try {
			const statement = await bankStatementService.getStatementById(req.params.id as string);
			res.json({ data: statement });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}

	async autoMatch(req: AuthRequest, res: Response) {
		try {
			const result = await bankStatementService.autoMatch(req.params.id as string);
			res.json({ data: result });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async manualMatch(req: AuthRequest, res: Response) {
		try {
			const validation = manualMatchSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}
			await bankStatementService.manualMatch(req.params.lineId as string, validation.data.movementId);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async unmatch(req: AuthRequest, res: Response) {
		try {
			await bankStatementService.unmatch(req.params.lineId as string);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async unmatchedMovements(req: AuthRequest, res: Response) {
		try {
			const movements = await bankStatementService.listUnmatchedMovements(req.params.id as string);
			res.json({ data: movements });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}
}

export const bankStatementController = new BankStatementController();
