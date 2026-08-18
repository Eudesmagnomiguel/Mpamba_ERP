import { prisma } from '../../config/prisma.config.js';

export class UserService {
	/**
	 * Lista utilizadores com paginação e filtro por organização.
	 * Se a organização for fornecida, filtra por ela.
	 * Um utilizador normal só vê os da sua organização.
	 */
	static async listUsers(options: {
		page?: number;
		pageSize?: number;
		organizationId?: string;
	} = {}) {
		const page = options.page || 1;
		const pageSize = options.pageSize || 10;
		const skip = (page - 1) * pageSize;

		const where = options.organizationId ? { organizationId: options.organizationId } : {};

		const [data, total] = await Promise.all([
			prisma.user.findMany({
				where,
				skip,
				take: pageSize,
				include: {
					roles: { include: { role: true } },
					organization: {
						include: {
							plan: true,
							subscription: { select: { status: true } },
							modules: { include: { module: true } },
						},
					},
				},
				orderBy: { name: 'asc' }
			}),
			prisma.user.count({ where })
		]);

		return {
			data,
			pagination: {
				total,
				page,
				pageSize,
				totalPages: Math.ceil(total / pageSize),
				hasNextPage: page < Math.ceil(total / pageSize),
				hasPreviousPage: page > 1,
			}
		};
	}

	static async getUserById(id: string, requestingUserOrgId?: string | null) {
		const user = await prisma.user.findUnique({
			where: { id },
			include: {
				roles: { include: { role: true } },
				organization: true
			}
		});

		if (!user) throw new Error('Usuário não encontrado');

		// Utilizador de uma org não pode ver utilizadores de outras orgs
		if (requestingUserOrgId && user.organizationId !== requestingUserOrgId) {
			throw new Error('Sem permissão para ver este usuário');
		}

		return user;
	}

	static async createUser(data: {
		name: string;
		email: string;
		password: string;
		organizationId?: string;
		roleIds?: string[];
		isActive?: boolean;
	}) {
		const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
		if (existingUser) throw new Error('Este email já está em uso');

		return prisma.user.create({
			data: {
				name: data.name,
				email: data.email,
				passwordHash: data.password,
				organizationId: data.organizationId ?? null,
				isActive: data.isActive ?? true,
				roles: {
					create: data.roleIds?.map((roleId: string) => ({ roleId })) ?? []
				}
			},
			include: { roles: { include: { role: true } } }
		});
	}

	static async updateUser(
		id: string,
		data: {
			name?: string;
			email?: string;
			password?: string;
			roleIds?: string[];
			isActive?: boolean;
		},
		requestingUserOrgId?: string | null
	) {
		const currentUser = await prisma.user.findUnique({ where: { id } });
		if (!currentUser) throw new Error('Usuário não encontrado');

		if (requestingUserOrgId && currentUser.organizationId !== requestingUserOrgId) {
			throw new Error('Sem permissão para editar este usuário');
		}

		const updateData: any = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.email !== undefined) updateData.email = data.email;
		if (data.isActive !== undefined) updateData.isActive = data.isActive;
		if (data.password) updateData.passwordHash = data.password;

		const user = await prisma.user.update({
			where: { id },
			data: updateData,
			include: { roles: { include: { role: true } } }
		});

		if (data.roleIds) {
			await prisma.userRole.deleteMany({ where: { userId: id } });
			await prisma.userRole.createMany({
				data: data.roleIds.map((roleId: string) => ({ userId: id, roleId }))
			});
		}

		return user;
	}

	static async deleteUser(id: string, requestingUserOrgId?: string | null) {
		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) throw new Error('Usuário não encontrado');

		if (requestingUserOrgId && user.organizationId !== requestingUserOrgId) {
			throw new Error('Sem permissão para excluir este usuário');
		}

		await prisma.$transaction([
			prisma.userRole.deleteMany({ where: { userId: id } }),
			prisma.user.delete({ where: { id } })
		]);
	}

	static async toggleUserStatus(id: string, isActive: boolean) {
		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) throw new Error('Usuário não encontrado');

		return prisma.user.update({
			where: { id },
			data: { isActive }
		});
	}
}
