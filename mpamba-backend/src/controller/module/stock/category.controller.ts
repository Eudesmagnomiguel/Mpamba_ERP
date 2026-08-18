import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { categoryService } from '../../../services/module/stock/category.service.js';
import { createCategorySchema, updateCategorySchema } from '../../../shared/dto/stock.dto.js';

export class CategoryController {
	async getAllCategories(req: AuthRequest, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 20;
			const search = req.query.search as string | undefined;

			const result = await categoryService.findAllCategories({ page, pageSize, search });
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar categorias' });
		}
	}

	async getCategoryById(req: AuthRequest, res: Response) {
		try {
			const category = await categoryService.findCategoryById(req.params.id as string);
			res.json({ data: category });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async createCategory(req: AuthRequest, res: Response) {
		try {
			const validation = createCategorySchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const category = await categoryService.createCategory(validation.data);
			res.status(201).json({ data: category });
		} catch (error: any) {
			const status = error.message.includes('já existe') ? 409 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async updateCategory(req: AuthRequest, res: Response) {
		try {
			const validation = updateCategorySchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const category = await categoryService.updateCategory(req.params.id as string, validation.data);
			res.json({ data: category });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 
				: error.message.includes('já existe') ? 409 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async deleteCategory(req: AuthRequest, res: Response) {
		try {
			await categoryService.deleteCategory(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 
				: error.message.includes('associa') ? 422 : 500;
			res.status(status).json({ message: error.message });
		}
	}
}

export const categoryController = new CategoryController();
