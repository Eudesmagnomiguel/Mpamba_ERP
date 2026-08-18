import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { catalogService } from '../../../services/module/billing/service.service.js';
import { serviceSchema, updateServiceSchema } from '../../../shared/dto/billing.dto.js';

export class ServiceController {
	async createService(req: AuthRequest, res: Response) {
		try {
			const validation = serviceSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const service = await catalogService.createService(validation.data);
			res.status(201).json({ data: service });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async updateService(req: AuthRequest, res: Response) {
		try {
			const validation = updateServiceSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const service = await catalogService.updateService(req.params.id as string, validation.data);
			res.json({ data: service });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async listServices(req: AuthRequest, res: Response) {
		try {
			const services = await catalogService.listServices({ search: req.query.search as string });
			res.json({ data: services });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getServiceById(req: AuthRequest, res: Response) {
		try {
			const service = await catalogService.getServiceById(req.params.id as string);
			res.json({ data: service });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}

	async deleteService(req: AuthRequest, res: Response) {
		try {
			await catalogService.deleteService(req.params.id as string);
			res.json({ message: 'Serviço removido com sucesso' });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}
}

export const serviceController = new ServiceController();
