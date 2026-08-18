import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.config.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';

// Nunca incluir passwordHash nas respostas da API
const USER_SAFE_SELECT = {
	id: true,
	name: true,
	email: true,
	username: true,
	urlImageProfile: true,
	isActive: true,
	hasCustomModuleAccess: true,
	organizationId: true,
	createdAt: true,
	updatedAt: true,
	roles: {
		include: { role: true }
	},
	organization: true,
	moduleAccess: {
		include: { module: { select: { code: true, name: true } } }
	}
} as const;

/** Achata `moduleAccess` (relação Prisma) para um array simples de códigos, mais fácil de consumir no frontend. */
function formatUser(user: any) {
	if (!user) return user;
	return {
		...user,
		moduleAccess: (user.moduleAccess ?? []).map((ma: any) => ma.module.code),
	};
}

export class UserController {
	/**
	 * Substitui os módulos atribuídos individualmente a um funcionário,
	 * restringindo-o a um subconjunto dos módulos ativos da organização.
	 * Apenas quem já tem permissão de gerir utilizadores (na prática, o
	 * admin da organização) chega a chamar isto — ver user.routes.ts.
	 */
	private static async syncUserModules(userId: string, organizationId: string | null | undefined, moduleCodes: string[]) {
		if (!organizationId) return;

		const orgModules = await prisma.organizationModule.findMany({
			where: { organizationId, isActive: true },
			include: { module: true }
		});
		const validModuleIds = orgModules
			.filter((om) => moduleCodes.includes(om.module.code))
			.map((om) => om.moduleId);

		await prisma.$transaction([
			prisma.userModule.deleteMany({ where: { userId } }),
			...(validModuleIds.length > 0
				? [prisma.userModule.createMany({ data: validModuleIds.map((moduleId) => ({ userId, moduleId })) })]
				: []),
			prisma.user.update({ where: { id: userId }, data: { hasCustomModuleAccess: true } }),
		]);
	}

	static async list(req: AuthRequest, res: Response) {
		try {
			const { page = 1, pageSize = 10, organizationId } = req.query;
			const skip = (Number(page) - 1) * Number(pageSize);
			const take = Number(pageSize);

			// Se não for super admin, só pode ver usuários da sua organização
			const filterOrganizationId = req.user?.organizationId || organizationId as string;

			const where = filterOrganizationId ? { organizationId: filterOrganizationId } : {};

			const [data, total] = await Promise.all([
				prisma.user.findMany({
					where,
					skip,
					take,
					select: USER_SAFE_SELECT,
					orderBy: { name: 'asc' }
				}),
				prisma.user.count({ where })
			]);

			return res.status(200).json({
				status: 'success',
				data: data.map(formatUser),
				pagination: {
					total,
					page: Number(page),
					pageSize: Number(pageSize),
					totalPages: Math.ceil(total / take)
				}
			});
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}

	static async getById(req: AuthRequest, res: Response) {
		try {
			const id = req.params.id as string;
			const user = await prisma.user.findUnique({
				where: { id },
				select: USER_SAFE_SELECT
			});

			if (!user) {
				return res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
			}

			// Verificação de permissão: usuários normais só veem usuários da mesma org
			if (req.user?.organizationId && user.organizationId !== req.user.organizationId) {
				return res.status(403).json({ status: 'error', message: 'Sem permissão para ver este usuário' });
			}

			return res.status(200).json({ status: 'success', data: formatUser(user) });
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}

	static async create(req: AuthRequest, res: Response) {
		try {
			const { name, email, username, password, organizationId, roleIds, isActive = true, moduleCodes } = req.body;

			// Se for admin de org, o organizationId é forçado para a dele
			const finalOrgId = req.user?.organizationId || organizationId;

			const existingUser = await prisma.user.findUnique({ where: { email } });
			if (existingUser) {
				return res.status(400).json({ status: 'error', message: 'Este email já está em uso' });
			}

			if (username) {
				const existingUsername = await prisma.user.findUnique({ where: { username } });
				if (existingUsername) {
					return res.status(400).json({ status: 'error', message: 'Este nome de utilizador já está em uso' });
				}
			}

			const passwordHash = await bcrypt.hash(password, 10);
			let user = await prisma.user.create({
				data: {
					name,
					email,
					username: username || null,
					passwordHash,
					organizationId: finalOrgId,
					isActive,
					roles: {
						create: roleIds?.map((roleId: string) => ({
							roleId
						}))
					}
				},
				select: USER_SAFE_SELECT
			});

			if (Array.isArray(moduleCodes)) {
				await UserController.syncUserModules(user.id, finalOrgId, moduleCodes);
				user = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: USER_SAFE_SELECT });
			}

			return res.status(201).json({ status: 'success', data: formatUser(user) });
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}

	static async update(req: AuthRequest, res: Response) {
		try {
			const id = req.params.id as string;
			const { name, email, username, password, roleIds, isActive, moduleCodes } = req.body;

			const currentUser = await prisma.user.findUnique({ where: { id } });
			if (!currentUser) {
				return res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
			}

			// Proteção de org
			if (req.user?.organizationId && currentUser.organizationId !== req.user.organizationId) {
				return res.status(403).json({ status: 'error', message: 'Sem permissão para editar este usuário' });
			}

			if (username && username !== currentUser.username) {
				const existingUsername = await prisma.user.findUnique({ where: { username } });
				if (existingUsername && existingUsername.id !== id) {
					return res.status(400).json({ status: 'error', message: 'Este nome de utilizador já está em uso' });
				}
			}

			const updateData: any = { name, email, isActive };
			if (username !== undefined) updateData.username = username || null;
			if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

			let user = await prisma.user.update({
				where: { id },
				data: updateData,
				select: USER_SAFE_SELECT
			});

			// Atualizar roles se fornecido
			if (roleIds) {
				await prisma.userRole.deleteMany({ where: { userId: id } });
				await prisma.userRole.createMany({
					data: roleIds.map((roleId: string) => ({
						userId: id,
						roleId
					}))
				});
			}

			if (Array.isArray(moduleCodes)) {
				await UserController.syncUserModules(id, currentUser.organizationId, moduleCodes);
			}

			if (roleIds || Array.isArray(moduleCodes)) {
				user = await prisma.user.findUniqueOrThrow({ where: { id }, select: USER_SAFE_SELECT });
			}

			return res.status(200).json({ status: 'success', data: formatUser(user) });
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}

	static async delete(req: AuthRequest, res: Response) {
		try {
			const id = req.params.id as string;

			const user = await prisma.user.findUnique({ where: { id } });
			if (!user) {
				return res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
			}

			if (req.user?.organizationId && user.organizationId !== req.user.organizationId) {
				return res.status(403).json({ status: 'error', message: 'Sem permissão para excluir este usuário' });
			}

			await prisma.$transaction([
				prisma.userRole.deleteMany({ where: { userId: id } }),
				prisma.user.delete({ where: { id } })
			]);
			return res.status(204).send();
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}
}
