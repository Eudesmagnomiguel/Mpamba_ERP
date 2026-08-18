import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { supplierService } from '../../../services/module/stock/supplier.service.js';
import { createSupplierSchema, updateSupplierSchema } from '../../../shared/dto/stock.dto.js';

export class SupplierController {
	async getAllSuppliers(req: AuthRequest, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 20;
			const search = req.query.search as string | undefined;

			const result = await supplierService.findAllSuppliers({ page, pageSize, search });
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar fornecedores' });
		}
	}

	async getSupplierById(req: AuthRequest, res: Response) {
		try {
			const supplier = await supplierService.findSupplierById(req.params.id as string);
			res.json({ data: supplier });
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async createSupplier(req: AuthRequest, res: Response) {
		try {
			const validation = createSupplierSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const supplier = await supplierService.createSupplier(validation.data);
			res.status(201).json({ data: supplier });
		} catch (error: any) {
			const status = error.message.includes('já existe') ? 409 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async updateSupplier(req: AuthRequest, res: Response) {
		try {
			const validation = updateSupplierSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const supplier = await supplierService.updateSupplier(req.params.id as string, validation.data);
			res.json({ data: supplier });
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404 
				: error.message.includes('já existe') ? 409 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async deleteSupplier(req: AuthRequest, res: Response) {
		try {
			await supplierService.deleteSupplier(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}
}

export const supplierController = new SupplierController();
