import { useAuthStore } from '@/store/auth.store';

/**
 * Hook para verificar se um módulo está ativo na subscrição da organização.
 * Baseia-se nos módulos retornados pelo backend no token de autenticação.
 *
 * Códigos de módulo disponíveis (devem corresponder ao seed do backend):
 *   'faturacao' | 'stock' | 'tesouraria'
 *
 * Super Admins têm acesso a todos os módulos por defeito.
 */
/** Prefixo das permissões (RBAC) associadas a cada módulo — usado para não
 *  mostrar um módulo a um funcionário sem nenhuma permissão dentro dele,
 *  mesmo que o módulo esteja ativo para a organização. */
const MODULE_PERMISSION_PREFIX: Record<string, string> = {
    stock: 'stock:',
    faturacao: 'billing:',
    tesouraria: 'treasury:',
    contabilidade: 'accounting:',
};

export function useModuleAccess() {
    const user = useAuthStore((state) => state.user);
    const modules: string[] = user?.modules ?? [];
    const permissions: string[] = user?.permissions ?? [];
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    /**
     * Verifica se um módulo está ativo para a organização E se o utilizador
     * tem pelo menos uma permissão dentro desse módulo.
     */
    function hasModule(moduleCode: string): boolean {
        if (isSuperAdmin) return true;

        const moduleActive = modules.some(
            (m) => m.toLowerCase() === moduleCode.toLowerCase()
        );
        if (!moduleActive) return false;

        const prefix = MODULE_PERMISSION_PREFIX[moduleCode.toLowerCase()];
        if (!prefix) return true;

        return permissions.some((p) => p.startsWith(prefix));
    }

    return {
        modules,
        isSuperAdmin,
        hasModule,
        hasBilling: hasModule('faturacao'),
        hasStock: hasModule('stock'),
        hasTreasury: hasModule('tesouraria'),
        /** True se tiver Billing E Treasury — integrações cruzadas disponíveis */
        hasBillingAndTreasury: hasModule('faturacao') && hasModule('tesouraria'),
        /** True se tiver Stock E Treasury — compras afetam tesouraria */
        hasStockAndTreasury: hasModule('stock') && hasModule('tesouraria'),
        /** True se tiver Billing E Stock — vendas baixam stock automaticamente */
        hasBillingAndStock: hasModule('faturacao') && hasModule('stock'),
    };
}
