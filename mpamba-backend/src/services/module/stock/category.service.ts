import { prisma } from '../../../config/prisma.config.js';
import { BaseStockService } from './base.service.js';
import type { CreateCategoryDto, UpdateCategoryDto } from '../../../shared/dto/stock.dto.js';

export class CategoryService extends BaseStockService {
	async findAllCategories(paginationOptions?: { page?: number; pageSize?: number; search?: string }) {
		const orgId = this.orgId;
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 20;
		const skip = (page - 1) * pageSize;
		const search = paginationOptions?.search;

		const where: any = { organizationId: orgId };
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}

		const [data, total] = await Promise.all([
			prisma.productCategory.findMany({ 
				where, 
				orderBy: { name: 'asc' }, 
				skip, 
				take: pageSize,
				include: { _count: { select: { products: true } } }
			}),
			prisma.productCategory.count({ where }),
		]);

		const totalPages = Math.ceil(total / pageSize);

		return {
			data,
			pagination: { page, pageSize, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
		};
	}

	async findCategoryById(id: string) {
		const orgId = this.orgId;
		const category = await prisma.productCategory.findFirst({ 
			where: { id, organizationId: orgId },
			include: { _count: { select: { products: true } } }
		});
		if (!category) throw new Error('Categoria não encontrada');
		return category;
	}

	async createCategory(data: CreateCategoryDto) {
		const orgId = this.orgId;

		const existing = await prisma.productCategory.findFirst({
			where: { name: data.name, organizationId: orgId }
		});
		if (existing) throw new Error(`Categoria "${data.name}" já existe`);

		return prisma.productCategory.create({
			data: { ...data, organizationId: orgId }
		});
	}

	async updateCategory(id: string, data: UpdateCategoryDto) {
		const orgId = this.orgId;

		const category = await prisma.productCategory.findFirst({ where: { id, organizationId: orgId } });
		if (!category) throw new Error('Categoria não encontrada');

		if (data.name && data.name !== category.name) {
			const existing = await prisma.productCategory.findFirst({
				where: { name: data.name, organizationId: orgId, NOT: { id } }
			});
			if (existing) throw new Error(`Categoria "${data.name}" já existe`);
		}

		return prisma.productCategory.update({ where: { id }, data });
	}

	async deleteCategory(id: string) {
		const orgId = this.orgId;
		const category = await prisma.productCategory.findFirst({ where: { id, organizationId: orgId } });
		if (!category) throw new Error('Categoria não encontrada');

		const productCount = await prisma.product.count({ where: { categoryId: id } });
		if (productCount > 0) {
			throw new Error('Não é possível eliminar uma categoria com produtos associados. Desative-a ou mova os produtos primeiro.');
		}

		return prisma.productCategory.delete({ where: { id } });
	}
}

export const categoryService = new CategoryService();
