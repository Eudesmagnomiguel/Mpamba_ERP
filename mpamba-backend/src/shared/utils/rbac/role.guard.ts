import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../../middleware/auth.middleware.js";
import { rbacService } from "../../../services/core/rbac.service.js";

export const roleGuard = (roleName: string) => {
	return async (req: AuthRequest, res: Response, next: NextFunction) => {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			// Use user.sub as the userId from the JWT payload
			const hasRole = await rbacService.hasRole(user.sub, roleName);
			if (!hasRole) {
				return res.status(403).json({ message: `Forbidden: Missing role ${roleName}` });
			}
			next();
		} catch (error) {
			next(error);
		}
	};
};