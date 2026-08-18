import {
    Package,
    BarChart3,
    UserCircle2,
    Truck,
    ArrowUpDown,
    ArrowDown,
    ArrowUp,
    LayoutDashboard,
    Shield,
    Lock,
    CreditCard,
    Box,
    ShieldCheck,
    Settings2
} from 'lucide-react';
import icon from '@/assets/images/icon/icon4.png';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import { LayoutConfig } from '../../../../components/layout/module/LayoutContext';

export const stockConfig: LayoutConfig = {
    logo: icon,
    rootHref: '/stock',
    settingsHref: '/core/settings',

    routeLabels: {
        stock: 'Início',
        products: 'Produtos',
        categories: 'Categorias',
        suppliers: 'Fornecedores',
        entries: 'Entradas',
        exits: 'Saídas',
        movements: 'Movimentos',
        reports: 'Relatórios',
        users: 'Usuários',
        settings: 'Configurações',
        profile: 'Perfil',
    },

    groups: [
        {
            label: 'Geral',
            items: [
                { name: 'Visão Geral', href: '/stock', icon: LayoutDashboard, permission: null },
            ],
        },
        {
            label: 'Inventário',
            items: [
                { name: 'Produtos', href: '/stock/products', icon: Package, permission: PERMISSIONS.STOCK_PRODUCT_VIEW },
                { name: 'Categorias', href: '/stock/categories', icon: BarChart3, permission: PERMISSIONS.STOCK_CATEGORY_VIEW },
                { name: 'Fornecedores', href: '/stock/suppliers', icon: Truck, permission: PERMISSIONS.STOCK_SUPPLIER_VIEW },
            ],
        },
        {
            label: 'Movimentações',
            items: [
                {
                    name: 'Movimentos',
                    href: '/stock/movements',
                    icon: ArrowUpDown,
                    permission: PERMISSIONS.STOCK_MOVEMENT_VIEW,
                    children: [
                        { name: 'Entradas', href: '/stock/entries', icon: ArrowDown, permission: PERMISSIONS.STOCK_ENTRY_VIEW },
                        { name: 'Saídas', href: '/stock/exits', icon: ArrowUp, permission: PERMISSIONS.STOCK_EXIT_VIEW },
                    ],
                },
            ],
        },
        {
            label: 'Gestão do Sistema',
            items: [
                { name: 'Utilizadores', href: '/core/users', icon: UserCircle2, permission: PERMISSIONS.USER_VIEW },
                { name: 'Funções & Acesso', href: '/core/roles', icon: ShieldCheck, permission: PERMISSIONS.ROLE_VIEW },
                { name: 'Subscrição', href: '/core/subscription', icon: CreditCard, permission: PERMISSIONS.BILLING_REPORT_VIEW },
                { name: 'Configurações', href: '/core/settings', icon: Settings2, permission: PERMISSIONS.SETTING_VIEW },
            ],
        },
    ],
};