import type { Request, Response, NextFunction } from 'express';
import { JwtStrategy } from '../shared/utils/jwt.strategy.js';
import type { JwtPayload } from '../shared/types/core/auth.types.js';
import { organizationContext } from '../shared/utils/organization.context.js';

export type AuthRequest = Request & { user?: JwtPayload; organizationId?: string };
export const authMiddleware = authenticate;

// Extend Express Request type to include user and organizationId
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            organizationId?: string;
        }
    }
}

// Middleware to authenticate requests using JWT
export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        const payload = JwtStrategy.verify(token);

        // Attach user to request
        req.user = payload;

        // Estabelecer contexto de organização
        const contextData = {
            organizationId: payload.organizationId || '',
            userId: payload.sub,
            roles: payload.roles || []
        };

        // Executar próximos middlewares e handlers dentro do contexto
        organizationContext.run(contextData, () => {
            next();
        });
    } catch (error: any) {
        return res.status(401).json({ message: error.message || 'Token inválido' });
    }
}

// Middleware to check if user has required permissions
export function requirePermissions(...requiredRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        const hasPermission = requiredRoles.some(role =>
            req.user!.roles.includes(role)
        );

        if (!hasPermission) {
            return res.status(403).json({
                message: 'Sem permissão para acessar este recurso'
            });
        }

        next();
    };
}