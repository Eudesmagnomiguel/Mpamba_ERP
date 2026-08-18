import { prisma } from "../../config/prisma.config.js";
import type { CreateOrganizationDto, UpdateOrganizationDto } from "../../shared/dto/organization.dto.js";

export class OrganizationService {
	async findAll(paginationOptions?: { page?: number; pageSize?: number }) {
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 10;
		const skip = (page - 1) * pageSize;

		const [data, total] = await Promise.all([
			prisma.organization.findMany({
				include: {
					modules: {
						include: { module: true }
					},
					plan: true,
					subscription: { select: { status: true } },
					_count: { select: { users: true } }
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: pageSize
			}),
			prisma.organization.count()
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
		return prisma.organization.findUnique({
			where: { id },
			include: {
				modules: {
					include: { module: true }
				},
				users: {
					select: {
						id: true,
						name: true,
						email: true,
						isActive: true
					}
				}
			}
		});
	}

	async create(data: CreateOrganizationDto) {
		return prisma.organization.create({
			data: {
				name: data.name,
				...(data.nif !== undefined && { nif: data.nif }),
				...(data.address !== undefined && { address: data.address }),
				...(data.phone !== undefined && { phone: data.phone }),
				...(data.email !== undefined && data.email !== '' && { email: data.email }),
				...(data.planId !== undefined && data.planId !== '' && { planId: data.planId }),
				...(data.isActive !== undefined && { isActive: data.isActive })
			}
		});
	}

	async update(id: string, data: UpdateOrganizationDto & { invoiceFooterNote?: string; invoiceDueDays?: number; posInvoiceThreshold?: number }) {
		return prisma.organization.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.nif !== undefined && { nif: data.nif }),
				...(data.address !== undefined && { address: data.address }),
				...(data.phone !== undefined && { phone: data.phone }),
				...(data.email !== undefined && { email: data.email === '' ? null : data.email }),
				...(data.planId !== undefined && { planId: data.planId === '' ? null : data.planId }),
				...(data.isActive !== undefined && { isActive: data.isActive }),
				...(data.invoiceFooterNote !== undefined && { invoiceFooterNote: data.invoiceFooterNote === '' ? null : data.invoiceFooterNote }),
				...(data.invoiceDueDays !== undefined && { invoiceDueDays: data.invoiceDueDays }),
				...(data.posInvoiceThreshold !== undefined && { posInvoiceThreshold: data.posInvoiceThreshold })
			}
		});
	}

	async delete(id: string) {
		// 1. Check if organization exists
		const org = await prisma.organization.findUnique({
			where: { id },
			select: {
				id: true,
				users: { take: 1 },
				roles: {
					select: { id: true }
				},
				_count: {
					select: { users: true }
				}
			}
		});

		if (!org) {
			throw new Error('Organização não encontrada');
		}

		// 2. Perform deletion in a transaction (delete users along with org)
		return prisma.$transaction(async (tx) => {
			const roleIds = org.roles.map(r => r.id);

			// Delete user roles first
			await tx.userRole.deleteMany({
				where: { 
					role: {
						organizationId: id
					}
				}
			});

			// Delete role permissions
			if (roleIds.length > 0) {
				await tx.rolePermission.deleteMany({
					where: { roleId: { in: roleIds } }
				});

				// Delete roles
				await tx.role.deleteMany({
					where: { organizationId: id }
				});
			}

			// Delete users from organization
			await tx.user.deleteMany({
				where: { organizationId: id }
			});

			// Delete organization modules
			await tx.organizationModule.deleteMany({
				where: { organizationId: id }
			});

			// Delete activation codes
			await tx.activationCode.deleteMany({
				where: { organizationId: id }
			});

			// Finally delete the organization
			return tx.organization.delete({
				where: { id }
			});
		}, {
			timeout: 10000 // Set a 10s timeout for the transaction
		});
	}

	async assignModule(organizationId: string, moduleId: string) {
		return prisma.organizationModule.create({
			data: {
				organizationId,
				moduleId
			}
		});
	}

	async removeModule(organizationId: string, moduleId: string) {
		return prisma.organizationModule.deleteMany({
			where: {
				organizationId,
				moduleId
			}
		});
	}
}

export const organizationService = new OrganizationService();