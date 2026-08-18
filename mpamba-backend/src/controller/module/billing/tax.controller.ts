import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { taxService } from '../../../services/module/billing/tax.service.js';
import { taxRuleSchema, updateTaxRuleSchema } from '../../../shared/dto/billing.dto.js';

export class TaxController {
	async listTaxRules(req: AuthRequest, res: Response) {
		try {
			const taxRules = await taxService.listTaxRules();
			res.json({ data: taxRules });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async createTaxRule(req: AuthRequest, res: Response) {
		try {
			const validation = taxRuleSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const taxRule = await taxService.createTaxRule(validation.data);
			res.status(201).json({ data: taxRule });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async updateTaxRule(req: AuthRequest, res: Response) {
		try {
			const validation = updateTaxRuleSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const taxRule = await taxService.updateTaxRule(req.params.id as string, validation.data);
			res.json({ data: taxRule });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async deleteTaxRule(req: AuthRequest, res: Response) {
		try {
			await taxService.deleteTaxRule(req.params.id as string);
			res.json({ message: 'Regra fiscal removida com sucesso' });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}
}

export const taxController = new TaxController();
