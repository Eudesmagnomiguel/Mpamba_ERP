import { prisma } from '../../../config/prisma.config.js';
import type { CreateCategoryDto } from '../../../shared/dto/treasury.dto.js';
import { BaseTreasuryService } from './base.service.js';

export class CategoryService extends BaseTreasuryService {
	async createCategory(data: CreateCategoryDto) {
		return prisma.financialCategory.create({
			data: {
				...data,
				organizationId: this.orgId,
			},
		});
	}

	async getCategories(type?: 'ENTRADA' | 'SAIDA') {
		const orgId = this.orgIdOrNull;
		if (!orgId) return [];

		return prisma.financialCategory.findMany({
			where: {
				organizationId: orgId,
				isActive: true,
				...(type ? { type } : {})
			},
			orderBy: { name: 'asc' }
		});
	}

	async getCategoryById(categoryId: string) {
		const category = await prisma.financialCategory.findFirst({
			where: { id: categoryId, organizationId: this.orgId }
		});
		if (!category) throw new Error('Categoria não encontrada');
		return category;
	}

	async updateCategory(categoryId: string, data: any) {
		const category = await prisma.financialCategory.findFirst({
			where: { id: categoryId, organizationId: this.orgId }
		});
		if (!category) throw new Error('Categoria não encontrada');

		return prisma.financialCategory.update({
			where: { id: categoryId },
			data
		});
	}

	async deleteCategory(categoryId: string) {
		const category = await prisma.financialCategory.findFirst({
			where: { id: categoryId, organizationId: this.orgId }
		});
		if (!category) throw new Error('Categoria não encontrada');

		return prisma.financialCategory.update({
			where: { id: categoryId },
			data: { isActive: false }
		});
	}

	/**
	 * 🏷️ Provisiona as categorias padrão para uma organização
	 */
	async seedDefaultCategories(orgId: string) {
		const defaultCategories = [
			{ name: 'Vendas', type: 'ENTRADA' },
			{ name: 'Serviços', type: 'ENTRADA' },
			{ name: 'Salários', type: 'SAIDA' },
			{ name: 'Fornecedores', type: 'SAIDA' },
			{ name: 'Operacional', type: 'SAIDA' },
		];

		const creations = defaultCategories.map(cat => 
			prisma.financialCategory.upsert({
				where: { 
					name_organizationId_type: { 
						name: cat.name, 
						organizationId: orgId, 
						type: cat.type as any 
					} 
				},
				update: { isActive: true },
				create: { ...cat, organizationId: orgId } as any
			})
		);

		return Promise.all(creations);
	}
}

export const categoryService = new CategoryService();
