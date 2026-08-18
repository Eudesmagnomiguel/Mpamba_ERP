import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { costCenterService } from '../../../services/module/treasury/cost-center.service.js';

export class CostCenterController {
	async createCostCenter(req: AuthRequest, res: Response) {
		try {
			const costCenter = await costCenterService.createCostCenter(req.body);
			res.status(201).json({ data: costCenter });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async getCostCenters(req: AuthRequest, res: Response) {
		try {
			const costCenters = await costCenterService.getCostCenters();
			res.json({ data: costCenters });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getCostCenterById(req: AuthRequest, res: Response) {
		try {
			const costCenter = await costCenterService.getCostCenterById(req.params.id as string);
			res.json({ data: costCenter });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}

	async updateCostCenter(req: AuthRequest, res: Response) {
		try {
			const costCenter = await costCenterService.updateCostCenter(req.params.id as string, req.body);
			res.json({ data: costCenter });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async deleteCostCenter(req: AuthRequest, res: Response) {
		try {
			await costCenterService.deleteCostCenter(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}
}

export const costCenterController = new CostCenterController();
