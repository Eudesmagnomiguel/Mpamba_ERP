import { prisma } from "../../config/prisma.config.js";
import { organizationContext } from "../../shared/utils/organization.context.js";
import type { CreateRoleDto, UpdateRoleDto } from "../../shared/dto/role.dto.js";

export class RoleService {
	private get orgId(): string | null {
		return organizationContext.getOrganizationId() ?? null;
	}

	private async resolveOrganizationId(dataOrganizationId?: string): Promise<string> {
		const contextOrgId = this.orgId;
		if (contextOrgId) return contextOrgId;

		if (organizationContext.isSuperAdmin() && dataOrganizationId) {
			return dataOrganizationId;
		}

		if (organizationContext.isSuperAdmin()) {
			const systemOrganization = await prisma.organization.upsert({
				where: { nif: '000000000' },
				update: {},
				create: {
					name: 'Mpamba System',
					nif: '000000000',
					isActive: true
				}
			});

			return systemOrganization.id;
		}

		throw new Error("Organization context required for creating roles");
	}

	async findAll(paginationOptions?: { page?: number; pageSize?: number }) {
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 10;
		const skip = (page - 1) * pageSize;
		const orgId = this.orgId;
		const whereClause = orgId ? { organizationId: orgId } : {};

		const [data, total] = await Promise.all([
			prisma.role.findMany({
				where: whereClause,
				include: {
					permissions: {
						include: { permission: true }
					}
				},
				orderBy: { name: 'asc' },
				skip,
				take: pageSize
			}),
			prisma.role.count({ where: whereClause })
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
		const orgId = this.orgId;

		return prisma.role.findFirst({
			where: orgId ? { id, organizationId: orgId } : { id },
			include: {
				permissions: {
					include: { permission: true }
				},
				module: {
					select: { id: true, name: true, code: true }
				}
			}
		});
	}

	async findByModule(moduleCode: string, paginationOptions?: { page?: number; pageSize?: number }) {
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 10;
		const skip = (page - 1) * pageSize;
		const orgId = this.orgId;

		// Se tem organizationId (usuário normal), filtra apenas roles da organização
		// Se não tem organizationId (Super Admin), retorna roles de todas as organizações
		const whereClause = orgId ? { organizationId: orgId } : {};

		// Encontrar todos os roles com suas permissões
		const allRoles = await prisma.role.findMany({
			where: whereClause,
			include: {
				permissions: {
					include: { permission: true }
				}
			},
			orderBy: { name: 'asc' }
		});

		// Filtrar roles que têm permissões para o módulo específico
		const rolesForModule = allRoles.filter((role: any) => {
			return role.permissions.some((rp: any) => 
				rp.permission.code.startsWith(`${moduleCode}:`)
			);
		});

		// Aplicar paginação
		const paginatedRoles = rolesForModule.slice(skip, skip + pageSize);
		const total = rolesForModule.length;
		const totalPages = Math.ceil(total / pageSize);

		return {
			data: paginatedRoles,
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

	async create(data: CreateRoleDto) {
		const orgId = await this.resolveOrganizationId(data.organizationId);
		const organization = await prisma.organization.findUnique({
			where: { id: orgId }
		});

		if (!organization) {
			throw new Error("Organização não encontrada");
		}

		return prisma.role.create({
			data: {
				name: data.name,
				description: data.description ?? null,
				organizationId: orgId,
				moduleId: data.moduleId ?? null,
				permissions: data.permissionIds ? {
					create: data.permissionIds.map((permissionId: string) => ({
						permission: { connect: { id: permissionId } }
					}))
				} : undefined
			} as any
		});
	}

	async update(id: string, data: UpdateRoleDto) {
		const orgId = this.orgId;
		const role = await prisma.role.findFirst({
			where: orgId ? { id, organizationId: orgId } : { id }
		});

		if (!role) {
			throw new Error("Papel não encontrado");
		}

		const updateData: Record<string, unknown> = {};

		if (data.name !== undefined) {
			updateData.name = data.name;
		}

		if (data.description !== undefined) {
			updateData.description = data.description || null;
		}

		if (data.permissionIds !== undefined) {
			updateData.permissions = {
				deleteMany: {},
				create: data.permissionIds.map((permissionId: string) => ({
					permission: { connect: { id: permissionId } }
				}))
			};
		}

		if (data.moduleId !== undefined) {
			updateData.moduleId = data.moduleId || null;
		}

		return prisma.role.update({
			where: orgId ? { id, organizationId: orgId } : { id },
			data: updateData as any
		});
	}


	async attachPermission(roleId: string, permissionId: string) {
		const orgId = this.orgId;
		// ensure role exists and belongs to org if needed
		const role = await prisma.role.findFirst({ where: orgId ? { id: roleId, organizationId: orgId } : { id: roleId } });
		if (!role) throw new Error('Papel não encontrado');

		// create relation if not exists
		return prisma.rolePermission.create({
			data: {
				roleId,
				permissionId
			}
		});
	}

	async detachPermission(roleId: string, permissionId: string) {
		const orgId = this.orgId;
		const role = await prisma.role.findFirst({ where: orgId ? { id: roleId, organizationId: orgId } : { id: roleId } });
		if (!role) throw new Error('Papel não encontrado');

		return prisma.rolePermission.delete({
			where: { roleId_permissionId: { roleId, permissionId } }
		});
	}

	async delete(id: string) {
		const orgId = this.orgId;

		// Verificar se o role existe
		const role = await prisma.role.findFirst({
			where: orgId ? { id, organizationId: orgId } : { id }
		});

		if (!role) {
			throw new Error("Papel não encontrado");
		}

		// Deletar relacionamentos primeiro
		await Promise.all([
			prisma.rolePermission.deleteMany({
				where: { roleId: id }
			}),
			prisma.userRole.deleteMany({
				where: { roleId: id }
			})
		]);

		// Agora deletar o role
		return prisma.role.delete({
			where: orgId ? { id, organizationId: orgId } : { id }
		});
	}
}

export const roleService = new RoleService();
