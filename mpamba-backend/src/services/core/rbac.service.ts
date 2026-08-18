import { prisma } from "../../config/prisma.config.js";

export class RbacService {
	async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
		const userWithPermissions = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				roles: {
					include: {
						role: {
							include: {
								permissions: {
									include: {
										permission: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!userWithPermissions) return false;

		return userWithPermissions.roles.some((userRole: any) =>
			userRole.role.permissions.some(
				(rp: any) => rp.permission.code === permissionCode
			)
		);
	}

	async hasRole(userId: string, roleName: string): Promise<boolean> {
		const userWithRoles = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				roles: {
					include: {
						role: true,
					},
				},
			},
		});

		if (!userWithRoles) return false;

		return userWithRoles.roles.some((ur: any) => ur.role.name === roleName);
	}

	async getUserPermissions(userId: string): Promise<string[]> {
		const userWithPermissions = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				roles: {
					include: {
						role: {
							include: {
								permissions: {
									include: {
										permission: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!userWithPermissions) return [];

		const permissions = new Set<string>();
		userWithPermissions.roles.forEach((ur: any) => {
			ur.role.permissions.forEach((rp: any) => {
				permissions.add(rp.permission.code);
			});
		});

		return Array.from(permissions);
	}
}

export const rbacService = new RbacService();