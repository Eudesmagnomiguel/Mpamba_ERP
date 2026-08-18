import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { journalService } from '../../../services/module/accounting/journal.service.js';
import { createManualEntrySchema, reverseEntrySchema } from '../../../shared/dto/accounting.dto.js';

export class JournalController {
	async list(req: AuthRequest, res: Response) {
		try {
			const { page, pageSize, startDate, endDate } = req.query;
			const result = await journalService.listEntries({
				page: page ? parseInt(page as string) : undefined,
				pageSize: pageSize ? parseInt(pageSize as string) : undefined,
				startDate: startDate ? new Date(startDate as string) : undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
			});
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getById(req: AuthRequest, res: Response) {
		try {
			const entry = await journalService.getEntryById(req.params.id as string);
			res.json({ data: entry });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}

	async create(req: AuthRequest, res: Response) {
		try {
			const data = createManualEntrySchema.parse(req.body);
			const entry = await journalService.createManualEntry(data);
			res.status(201).json({ data: entry });
		} catch (error: any) {
			if (error.name === 'ZodError') return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
			res.status(400).json({ message: error.message });
		}
	}

	async reverse(req: AuthRequest, res: Response) {
		try {
			const data = reverseEntrySchema.parse(req.body);
			const reversal = await journalService.reverseEntry(req.params.id as string, data.reason);
			res.status(201).json({ data: reversal });
		} catch (error: any) {
			if (error.name === 'ZodError') return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
			res.status(400).json({ message: error.message });
		}
	}
}

export const journalController = new JournalController();
