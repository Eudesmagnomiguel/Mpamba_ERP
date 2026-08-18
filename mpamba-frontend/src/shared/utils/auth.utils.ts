import { AuthUser } from "../types/auth.types";

/**
 * Determina o caminho de redirecionamento (Home) com base nos módulos e papel do usuário.
 */
export const getHomePath = (user: AuthUser | null): string => {
    if (!user) return "/signin";

    const normalizedRole = user.role?.toLowerCase().trim();
    const isSuperAdmin =
        !user.organizationId ||
        normalizedRole === 'super admin' ||
        normalizedRole === 'super administrador' ||
        normalizedRole === 'super-administrador' ||
        normalizedRole === 'super_admin' ||
        normalizedRole === 'superadmin';

    if (isSuperAdmin) {
        return "/admin/dashboard";
    }

    // Ordem de prioridade para redirecionamento inicial dos usuários de organização
    if (user.modules.includes('stock')) {
        return "/stock";
    }

    if (user.modules.includes('faturacao')) {
        return "/billing";
    }

    if (user.modules.includes('tesouraria')) {
        return "/treasury";
    }

    // Fallback padrão para administradores de organização ou usuários sem módulos específicos
    return "/admin/dashboard";
};
