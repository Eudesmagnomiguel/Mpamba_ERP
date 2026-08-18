import { prisma } from '../../../config/prisma.config.js';
import { BaseStockService } from './base.service.js';
import type { CreateProductDto, UpdateProductDto } from '../../../shared/dto/stock.dto.js';
import { NotificationService } from '../../core/notification.service.js';

const IMMUTABLE_PRODUCT_FIELDS = ['currentQuantity'] as const;

export class ProductService extends BaseStockService {
	async findAllProducts(paginationOptions?: { page?: number; pageSize?: number; search?: string; categoryId?: string }) {
		const orgId = this.orgId;
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 20;
		const skip = (page - 1) * pageSize;
		const search = paginationOptions?.search;
		const categoryId = paginationOptions?.categoryId;

		const where: any = { organizationId: orgId };
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ sku: { contains: search, mode: 'insensitive' } },
			];
		}
		if (categoryId) {
			where.categoryId = categoryId;
		}

		const [data, total] = await Promise.all([
			prisma.product.findMany({ 
				where, 
				include: { category: true },
				orderBy: { name: 'asc' }, 
				skip, 
				take: pageSize 
			}),
			prisma.product.count({ where }),
		]);

		const totalPages = Math.ceil(total / pageSize);

		return {
			data,
			pagination: { page, pageSize, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
		};
	}

	async findProductById(id: string) {
		const orgId = this.orgId;
		const product = await prisma.product.findFirst({ 
			where: { id, organizationId: orgId },
			include: { category: true }
		});
		if (!product) throw new Error('Produto não encontrado');
		return product;
	}

	async createProduct(data: CreateProductDto) {
		const orgId = this.orgId;
		const userId = this.userId;

		const existing = await prisma.product.findFirst({
			where: { sku: data.sku, organizationId: orgId },
		});
		if (existing) throw new Error(`SKU "${data.sku}" já está em uso nesta organização`);

		if (data.categoryId) {
			const cat = await prisma.productCategory.findFirst({
				where: { id: data.categoryId, organizationId: orgId }
			});
			if (!cat) throw new Error('Categoria não encontrada');
		}

		const { quantity, ...productData } = data as CreateProductDto & { quantity?: number };
		const initialQuantity = quantity ?? 0;

		return prisma.$transaction(async (tx) => {
			const product = await tx.product.create({
				data: { ...productData, organizationId: orgId, currentQuantity: initialQuantity, isActive: true },
				include: { category: true }
			});

			if (initialQuantity > 0) {
				await tx.stockMovement.create({
					data: {
						productId: product.id,
						type: 'ENTRADA',
						quantity: initialQuantity,
						reason: 'Stock inicial no registo do produto',
						userId,
						organizationId: orgId,
					},
				});
			}

			this.checkLowStock(product);

			return product;
		});
	}

	async updateProduct(id: string, data: UpdateProductDto) {
		const orgId = this.orgId;

		for (const field of IMMUTABLE_PRODUCT_FIELDS) {
			if (field in data) {
				throw new Error(
					`[STOCK] Alteração direta de "${field}" é proibida. ` +
					`Use os endpoints de movimentação (entrada/saída/ajuste).`
				);
			}
		}

		const product = await prisma.product.findFirst({ where: { id, organizationId: orgId } });
		if (!product) throw new Error('Produto não encontrado');

		if (data.sku && data.sku !== product.sku) {
			const existing = await prisma.product.findFirst({
				where: { sku: data.sku, organizationId: orgId, NOT: { id } },
			});
			if (existing) throw new Error(`SKU "${data.sku}" já está em uso nesta organização`);
		}

		if (data.categoryId && data.categoryId !== product.categoryId) {
			const cat = await prisma.productCategory.findFirst({
				where: { id: data.categoryId, organizationId: orgId }
			});
			if (!cat) throw new Error('Categoria não encontrada');
		}

		const { ...safeData } = data as any;
		delete safeData.currentQuantity;

		return prisma.product.update({ 
			where: { id }, 
			data: safeData,
			include: { category: true }
		});
	}

	async deleteProduct(id: string) {
		const orgId = this.orgId;
		const product = await prisma.product.findFirst({ where: { id, organizationId: orgId } });
		if (!product) throw new Error('Produto não encontrado');

		const movementCount = await prisma.stockMovement.count({ where: { productId: id } });
		if (movementCount > 0) {
			return prisma.product.update({
				where: { id },
				data: { isActive: false },
			});
		}

		return prisma.product.delete({ where: { id } });
	}

	async getStockSummary() {
		const orgId = this.orgId;

		const [totalProducts, lowStockItems, totalValueResult] = await Promise.all([
			prisma.product.count({ where: { organizationId: orgId, isActive: true } }),
			prisma.product.count({
				where: {
					organizationId: orgId,
					isActive: true,
					NOT: { minStock: null },
					AND: [
						{ currentQuantity: { lte: prisma.product.fields.minStock } }
					]
				} as any
			}),
			prisma.product.aggregate({
				where: { organizationId: orgId, isActive: true },
				_sum: {
					currentQuantity: true,
				}
			})
		]);

		const products = await prisma.product.findMany({
			where: { organizationId: orgId, isActive: true },
			select: { 
				currentQuantity: true, 
				price: true,
				category: {
					select: { name: true }
				}
			}
		});

		const totalInventoryValue = products.reduce((acc, p) => acc + (p.currentQuantity * (p.price || 0)), 0);

		// Calculate Category Distribution
		const categoryMap = new Map<string, number>();
		products.forEach(p => {
			const catName = p.category?.name || 'Sem Categoria';
			const val = p.currentQuantity * (p.price || 0);
			categoryMap.set(catName, (categoryMap.get(catName) || 0) + val);
		});

		const colors = ['#483061', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
		const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
			name,
			value: totalInventoryValue > 0 ? Math.round((value / totalInventoryValue) * 100) : 0,
			color: colors[index % colors.length]
		})).sort((a, b) => b.value - a.value).slice(0, 5);

		// Generate Evolution Data (Simulated for now based on current value)
		// In a real scenario, this would come from a 'StockSnapshot' table
		const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
		const currentMonth = new Date().getMonth();
		const evolutionData = [];
		
		for (let i = 6; i >= 0; i--) {
			const monthIndex = (currentMonth - i + 12) % 12;
			// Simulate some historical variation
			const factor = 1 + (Math.random() * 0.4 - 0.2); 
			evolutionData.push({
				name: months[monthIndex],
				value: Math.round(totalInventoryValue * factor)
			});
		}

		return {
			totalProducts,
			lowStockItems,
			totalQuantity: totalValueResult._sum.currentQuantity || 0,
			totalInventoryValue,
			categoryData,
			evolutionData
		};
	}

	async getMostUsedProducts(limit: number = 5) {
		const orgId = this.orgId;

		const result = await prisma.stockMovement.groupBy({
			by: ['productId'],
			where: {
				organizationId: orgId,
				type: 'SAIDA',
			},
			_sum: {
				quantity: true,
			},
			orderBy: {
				_sum: {
					quantity: 'desc',
				},
			},
			take: limit,
		});

		const products = await prisma.product.findMany({
			where: {
				id: { in: result.map(r => r.productId) },
			},
			select: {
				id: true,
				name: true,
				sku: true,
				unit: true,
			},
		});

		return result.map(r => ({
			...products.find(p => p.id === r.productId),
			totalExits: r._sum.quantity || 0,
		}));
	}

	public checkLowStock(updated: any, previous?: any) {
		if (updated.minStock === null || updated.minStock === undefined) return;
		const isLow = updated.currentQuantity <= updated.minStock;
		if (!isLow) return;

		console.warn(
			`⚠️ [ALERTA STOCK BAIXO] Produto "${updated.name}" (${updated.sku}): ` +
			`quantidade atual ${updated.currentQuantity} ${updated.unit} ` +
			`está no ou abaixo do mínimo de ${updated.minStock} ${updated.unit}.`
		);

		// Só notifica na transição para stock baixo, para não repetir a cada venda/movimento
		const wasAlreadyLow = previous ? previous.currentQuantity <= updated.minStock : false;
		if (!wasAlreadyLow) {
			NotificationService.notifyOrganization(updated.organizationId, {
				title: 'Stock baixo',
				message: `O produto "${updated.name}" (${updated.sku}) está com stock baixo: ${updated.currentQuantity} ${updated.unit} (mínimo: ${updated.minStock} ${updated.unit}).`,
				type: 'WARNING',
			}).catch((error) => console.error('[ProductService] Falha ao notificar stock baixo:', error));
		}
	}

	/**
	 * Linhas do relatório de inventário, com os números ainda como números.
	 *
	 * Fonte única do CSV e do Excel: o CSV converte para texto, o Excel usa os
	 * valores numéricos para que as colunas somem e ordenem na folha.
	 */
	async getInventoryReportRows(): Promise<InventoryReportRow[]> {
		const orgId = this.orgId;

		const products = await prisma.product.findMany({
			where: { organizationId: orgId },
			include: { category: true },
			orderBy: { name: 'asc' },
		});

		return products.map((p) => ({
			sku: p.sku,
			name: p.name,
			category: p.category?.name || 'Sem categoria',
			unit: p.unit,
			currentQuantity: p.currentQuantity,
			minStock: p.minStock ?? 0,
			price: p.price ?? 0,
			stockValue: (p.price ?? 0) * p.currentQuantity,
			status: p.isActive ? 'Ativo' : 'Inativo',
		}));
	}

	/** Relatório de inventário em CSV: um produto por linha, com quantidade e valor em stock. */
	async exportInventoryReport(): Promise<string> {
		const rows = await this.getInventoryReportRows();

		const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

		const header = ['SKU', 'Nome', 'Categoria', 'Unidade', 'Quantidade Atual', 'Stock Mínimo', 'Preço Unitário', 'Valor em Stock', 'Estado'];
		const body = rows.map((r) => [
			r.sku,
			r.name,
			r.category,
			r.unit,
			String(r.currentQuantity),
			String(r.minStock),
			String(r.price),
			String(r.stockValue),
			r.status,
		]);

		return [header, ...body]
			.map((row) => row.map((cell) => escapeCsv(String(cell))).join(','))
			.join('\r\n');
	}
}

export interface InventoryReportRow {
	sku: string;
	name: string;
	category: string;
	unit: string;
	currentQuantity: number;
	minStock: number;
	price: number;
	stockValue: number;
	status: string;
}

export const productService = new ProductService();
