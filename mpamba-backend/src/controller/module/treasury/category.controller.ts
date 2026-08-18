import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { categoryService } from '../../../services/module/treasury/category.service.js';
import { createCategorySchema } from '../../../shared/dto/treasury.dto.js';

export class CategoryController {
	async createCategory(req: AuthRequest, res: Response) {
		try {
			const validation = createCategorySchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const category = await categoryService.createCategory(validation.data);
			res.status(201).json({ data: category });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getCategories(req: AuthRequest, res: Response) {
		try {
			const type = req.query.type as 'ENTRADA' | 'SAIDA' | undefined;
			const categories = await categoryService.getCategories(type);
			res.json({ data: categories });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getCategoryById(req: AuthRequest, res: Response) {
		try {
			const category = await categoryService.getCategoryById(req.params.id as string);
			res.json({ data: category });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}

	async updateCategory(req: AuthRequest, res: Response) {
		try {
			const category = await categoryService.updateCategory(req.params.id as string, req.body);
			res.json({ data: category });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async deleteCategory(req: AuthRequest, res: Response) {
		try {
			await categoryService.deleteCategory(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}
}

export const categoryController = new CategoryController();
