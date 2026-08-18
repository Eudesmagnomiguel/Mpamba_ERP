import { prisma } from "../../config/prisma.config.js";
import type { CreatePermissionDto } from "../../shared/dto/permission.dto.js";

export class PermissionService {
	async findAll(paginationOptions?: { page?: number; pageSize?: number }) {
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 10;
		const skip = (page - 1) * pageSize;

		const [data, total] = await Promise.all([
			prisma.permission.findMany({
				orderBy: { code: 'asc' },
				skip,
				take: pageSize
			}),
			prisma.permission.count()
		]);

		const totalPages = Math.ceil(total / pageSize);

		return {
			data,
			pagination: {
				page,
				pageSize,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1
			}
		};
	}

	async findById(id: string) {
		return prisma.permission.findUnique({
			where: { id }
		});
	}

	async create(data: CreatePermissionDto) {
		return prisma.permission.create({
			data: {
				code: data.code,
				description: data.description ?? null
			} as any
		});
	}

	async update(id: string, data: CreatePermissionDto) {
		return prisma.permission.update({
			where: { id },
			data: {
				code: data.code,
				description: data.description ?? null
			} as any
		});
	}
}

export const permissionService = new PermissionService();