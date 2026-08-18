import { prisma } from '../../../config/prisma.config.js';
import { BaseStockService } from './base.service.js';
import { productService } from './product.service.js';
import { eventBus, EVENTS } from '../../../shared/utils/event-bus.js';
import type { AddStockDto, RemoveStockDto, AdjustStockDto } from '../../../shared/dto/stock.dto.js';

export class MovementService extends BaseStockService {
	private async validateProductInTx(
		tx: any,
		productId: string,
		orgId: string
	) {
		const product = await tx.product.findFirst({
			where: { id: productId, organizationId: orgId },
		});

		if (!product) throw new Error('Produto não encontrado');
		if (!product.isActive) throw new Error('Produto está desativado. Não é possível movimentar estoque.');

		return product;
	}

	async getMovements(
		productId?: string,
		paginationOptions?: { 
			page?: number; 
			pageSize?: number; 
			type?: string;
			startDate?: Date;
			endDate?: Date;
		}
	) {
		const orgId = this.orgId;
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 20;
		const skip = (page - 1) * pageSize;

		const where: any = { organizationId: orgId };
		if (productId) where.productId = productId;
		if (paginationOptions?.type) where.type = paginationOptions.type;
		
		if (paginationOptions?.startDate || paginationOptions?.endDate) {
			where.createdAt = {};
			if (paginationOptions.startDate) where.createdAt.gte = paginationOptions.startDate;
			if (paginationOptions.endDate) where.createdAt.lte = paginationOptions.endDate;
		}

		const [data, total] = await Promise.all([
			prisma.stockMovement.findMany({
				where,
				include: {
					product: { select: { id: true, name: true, sku: true, unit: true } },
					user: { select: { id: true, name: true } },
					supplier: { select: { id: true, name: true } },
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: pageSize,
			}),
			prisma.stockMovement.count({ where }),
		]);

		const totalPages = Math.ceil(total / pageSize);

		return {
			data,
			pagination: { page, pageSize, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
		};
	}

	async addStock(productId: string, data: AddStockDto) {
		const orgId = this.orgId;
		const userId = this.userId;

		return prisma.$transaction(async (tx) => {
			const product = await this.validateProductInTx(tx, productId, orgId);

			if (data.supplierId) {
				const sup = await tx.supplier.findFirst({
					where: { id: data.supplierId, organizationId: orgId }
				});
				if (!sup) throw new Error('Fornecedor não encontrado');
			}

			const movement = await tx.stockMovement.create({
				data: {
					productId,
					type: 'ENTRADA',
					quantity: data.quantity,
					reference: data.reference ?? null,
					reason: data.reason ?? null,
					supplierId: data.supplierId ?? null,
					userId,
					organizationId: orgId,
				},
			});

			const updated = await tx.product.update({
				where: { id: productId },
				data: { currentQuantity: { increment: data.quantity } },
			});

			productService.checkLowStock(updated, product);

			// 📡 Notificar outros módulos — Tesouraria pode registar despesa de compra
			eventBus.emit(EVENTS.STOCK.STOCK_INCREASED, { 
				productId, 
				productName: updated.name,
				quantity: data.quantity, 
				organizationId: orgId, 
				reference: data.reference,
				supplierId: data.supplierId,
				userId
			});

			return {
				movement,
				product: updated,
				previousQuantity: product.currentQuantity,
				newQuantity: updated.currentQuantity,
			};
		});
	}

	async removeStock(productId: string, data: RemoveStockDto) {
		const orgId = this.orgId;
		const userId = this.userId;

		return prisma.$transaction(async (tx) => {
			const product = await this.validateProductInTx(tx, productId, orgId);

			if (product.currentQuantity < data.quantity) {
				throw new Error(
					`Estoque insuficiente. Disponível: ${product.currentQuantity} ${product.unit}. ` +
					`Solicitado: ${data.quantity} ${product.unit}.`
				);
			}

			const movement = await tx.stockMovement.create({
				data: {
					productId,
					type: 'SAIDA',
					quantity: data.quantity,
					reference: data.reference ?? null,
					reason: data.reason ?? null,
					userId,
					organizationId: orgId,
				},
			});

			const updated = await tx.product.update({
				where: { id: productId },
				data: { currentQuantity: { decrement: data.quantity } },
			});

			productService.checkLowStock(updated, product);

			// 📡 Notificar outros módulos — útil para relatórios cruzados
			eventBus.emit(EVENTS.STOCK.STOCK_DECREASED, { 
				productId, 
				productName: updated.name,
				quantity: data.quantity, 
				organizationId: orgId, 
				reference: data.reference,
				userId
			});

			return {
				movement,
				product: updated,
				previousQuantity: product.currentQuantity,
				newQuantity: updated.currentQuantity,
			};
		});
	}

	async adjustStock(productId: string, data: AdjustStockDto) {
		const orgId = this.orgId;
		const userId = this.userId;

		return prisma.$transaction(async (tx) => {
			const product = await this.validateProductInTx(tx, productId, orgId);

			const newQuantity = product.currentQuantity + data.quantity;
			if (newQuantity < 0) {
				throw new Error(
					`Ajuste inválido. Saldo atual: ${product.currentQuantity} ${product.unit}. ` +
					`Ajuste de ${data.quantity} resultaria em saldo negativo (${newQuantity}).`
				);
			}

			const movement = await tx.stockMovement.create({
				data: {
					productId,
					type: 'AJUSTE',
					quantity: Math.abs(data.quantity),
					reference: data.reference ?? null,
					reason: data.reason,
					userId,
					organizationId: orgId,
				},
			});

			const updated = await tx.product.update({
				where: { id: productId },
				data: { currentQuantity: newQuantity },
			});

			productService.checkLowStock(updated, product);

			return {
				movement,
				product: updated,
				previousQuantity: product.currentQuantity,
				newQuantity: updated.currentQuantity,
				adjustment: data.quantity,
			};
		});
	}

	async reverseMovement(movementId: string, reason: string) {
		const orgId = this.orgId;
		const userId = this.userId;

		if (!reason || reason.trim().length < 5) {
			throw new Error('Justificativa de reversão obrigatória e deve ter pelo menos 5 caracteres.');
		}

		return prisma.$transaction(async (tx) => {
			const original = await tx.stockMovement.findFirst({
				where: { id: movementId, organizationId: orgId },
				include: { product: true },
			});

			if (!original) throw new Error('Movimento não encontrado');
			if (!original.product.isActive) {
				throw new Error('Produto está desativado. Não é possível reverter movimentos.');
			}

			let reverseType: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
			let quantityDelta: number;

			if (original.type === 'ENTRADA') {
				reverseType = 'SAIDA';
				quantityDelta = -original.quantity;
				if (original.product.currentQuantity < original.quantity) {
					throw new Error(
						`Não é possível reverter esta entrada. Estoque atual (${original.product.currentQuantity}) ` +
						`é menor que a quantidade a reverter (${original.quantity}).`
					);
				}
			} else if (original.type === 'SAIDA') {
				reverseType = 'ENTRADA';
				quantityDelta = original.quantity;
			} else {
				reverseType = 'AJUSTE';
				quantityDelta = -original.quantity;
				const newQty = original.product.currentQuantity + quantityDelta;
				if (newQty < 0) {
					throw new Error(
						`Reversão inválida. Saldo atual: ${original.product.currentQuantity}. ` +
						`Resultado seria negativo (${newQty}).`
					);
				}
			}

			const newQuantity = original.product.currentQuantity + quantityDelta;

			const reversal = await tx.stockMovement.create({
				data: {
					productId: original.productId,
					type: reverseType,
					quantity: original.quantity,
					reference: `REVERSÃO: ${original.id}`,
					reason: `[REVERSÃO] ${reason}`,
					userId,
					organizationId: orgId,
				},
			});

			const updated = await tx.product.update({
				where: { id: original.productId },
				data: { currentQuantity: newQuantity },
			});

			productService.checkLowStock(updated, original.product);

			return {
				originalMovement: original.id,
				reversalMovement: reversal,
				product: updated,
				previousQuantity: original.product.currentQuantity,
				newQuantity: updated.currentQuantity,
			};
		});
	}
}

export const movementService = new MovementService();
