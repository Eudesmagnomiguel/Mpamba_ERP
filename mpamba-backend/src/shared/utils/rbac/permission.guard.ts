import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../../middleware/auth.middleware.js";
import { rbacService } from "../../../services/core/rbac.service.js";
import type { PermissionCode } from "./permission.constants.js";

export const permissionGuard = (permission: PermissionCode) => {
	return async (req: AuthRequest, res: Response, next: NextFunction) => {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			// Super Admin (role === 'SUPER_ADMIN') bypass all permission checks
			const isSuperAdmin = user.roles.includes('SUPER_ADMIN') || user.roles.includes('Super Administrador');
			if (isSuperAdmin) {
				return next();
			}

			// Use user.sub as the userId from the JWT payload
			const hasPermission = await rbacService.hasPermission(user.sub, permission);
			if (!hasPermission) {
				console.warn(`[PermissionGuard] Utilizador ${user.sub} sem permissão: ${permission}`);
				return res.status(403).json({
					message: 'Não tem permissão para aceder a esta funcionalidade. Contacte o administrador da sua organização.',
					code: 'FORBIDDEN_PERMISSION',
				});
			}
			next();
		} catch (error) {
			next(error);
		}
	};
};