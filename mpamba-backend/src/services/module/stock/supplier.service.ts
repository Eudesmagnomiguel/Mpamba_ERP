import { prisma } from '../../../config/prisma.config.js';
import { BaseStockService } from './base.service.js';
import type { CreateSupplierDto, UpdateSupplierDto } from '../../../shared/dto/stock.dto.js';

export class SupplierService extends BaseStockService {
	async findAllSuppliers(paginationOptions?: { page?: number; pageSize?: number; search?: string }) {
		const orgId = this.orgId;
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 20;
		const skip = (page - 1) * pageSize;
		const search = paginationOptions?.search;

		const where: any = { organizationId: orgId };
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ nif: { contains: search, mode: 'insensitive' } },
			];
		}

		const [data, total] = await Promise.all([
			prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
			prisma.supplier.count({ where }),
		]);

		const totalPages = Math.ceil(total / pageSize);

		return {
			data,
			pagination: { page, pageSize, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
		};
	}

	async findSupplierById(id: string) {
		const orgId = this.orgId;
		const supplier = await prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
		if (!supplier) throw new Error('Fornecedor não encontrado');
		return supplier;
	}

	async createSupplier(data: CreateSupplierDto) {
		const orgId = this.orgId;

		if (data.nif) {
			const existing = await prisma.supplier.findFirst({
				where: { nif: data.nif, organizationId: orgId }
			});
			if (existing) throw new Error(`Fornecedor com NIF "${data.nif}" já existe`);
		}

		return prisma.supplier.create({
			data: { ...data, organizationId: orgId }
		});
	}

	async updateSupplier(id: string, data: UpdateSupplierDto) {
		const orgId = this.orgId;

		const supplier = await prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
		if (!supplier) throw new Error('Fornecedor não encontrado');

		if (data.nif && data.nif !== supplier.nif) {
			const existing = await prisma.supplier.findFirst({
				where: { nif: data.nif, organizationId: orgId, NOT: { id } }
			});
			if (existing) throw new Error(`Fornecedor com NIF "${data.nif}" já existe`);
		}

		return prisma.supplier.update({ where: { id }, data });
	}

	async deleteSupplier(id: string) {
		const orgId = this.orgId;
		const supplier = await prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
		if (!supplier) throw new Error('Fornecedor não encontrado');

		const movementCount = await prisma.stockMovement.count({ where: { supplierId: id } });
		if (movementCount > 0) {
			return prisma.supplier.update({ where: { id }, data: { isActive: false } });
		}

		return prisma.supplier.delete({ where: { id } });
	}
}

export const supplierService = new SupplierService();
