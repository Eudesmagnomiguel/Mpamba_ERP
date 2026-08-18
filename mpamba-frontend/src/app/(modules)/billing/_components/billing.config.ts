import {
    FileText,
    Users,
    Package,
    Percent,
    Layers3,
    FileSearch,
    Undo2,
    Receipt,
    LayoutDashboard,
    CreditCard,
    ShieldCheck,
    ShoppingCart,
    Settings2
} from 'lucide-react';
import icon from '@/assets/images/icon/icon4.png';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import { LayoutConfig } from '../../../../components/layout/module/LayoutContext';

export const billingConfig: LayoutConfig = {
    logo: icon,
    rootHref: '/billing',
    settingsHref: '/core/settings',

    routeLabels: {
        billing: 'Início',
        invoices: 'Faturas',
        proformas: 'Proformas',
        'credit-notes': 'Notas de Crédito',
        receipts: 'Recibos',
        services: 'Serviços',
        taxes: 'Impostos',
        documents: 'Documentos',
        customers: 'Clientes',
        reports: 'Relatórios',
        users: 'Usuários',
        settings: 'Configurações',
        pos: 'Posto de Venda',
        profile: 'Perfil',
    },

    groups: [
        {
            label: 'Geral',
            items: [
                { name: 'Visão Geral', href: '/billing', icon: LayoutDashboard, permission: null },
                { name: 'Posto de Venda', href: '/billing/pos', icon: ShoppingCart, permission: PERMISSIONS.BILLING_POS_MANAGE },
            ],
        },
        {
            label: 'Gestão',
            items: [
                { name: 'Clientes', href: '/billing/customers', icon: Users, permission: PERMISSIONS.CUSTOMER_VIEW },
                { name: 'Produtos', href: '/stock/products', icon: Package, permission: PERMISSIONS.STOCK_PRODUCT_VIEW },
                // { name: 'Relatórios', href: '/billing/reports', icon: BarChart3, permission: PERMISSIONS.BILLING_REPORT_VIEW },
            ],
        },
        {
            label: 'Faturação',
            items: [
                {
                    name: 'Documentos',
                    href: '/billing/docs',
                    icon: FileText,
                    permission: PERMISSIONS.INVOICE_VIEW,
                    children: [
                        { name: 'Faturas', href: '/billing/invoices', icon: FileText, permission: PERMISSIONS.INVOICE_VIEW },
                        { name: 'Proformas', href: '/billing/proformas', icon: FileSearch, permission: PERMISSIONS.INVOICE_VIEW },
                        { name: 'Notas de Crédito', href: '/billing/credit-notes', icon: Undo2, permission: PERMISSIONS.INVOICE_VIEW },
                        { name: 'Recibos', href: '/billing/receipts', icon: Receipt, permission: PERMISSIONS.INVOICE_VIEW },
                    ],
                },
                { name: 'Serviços', href: '/billing/services', icon: Package, permission: PERMISSIONS.INVOICE_CREATE },
            ],
        },
        {
            label: 'Configuração',
            items: [
                { name: 'Impostos', href: '/billing/taxes', icon: Percent, permission: PERMISSIONS.BILLING_TAX_MANAGE },
                { name: 'Séries de Docs', href: '/billing/documents', icon: Layers3, permission: PERMISSIONS.BILLING_SERIES_MANAGE },
                // { name: 'Configurações', href: '/billing/settings', icon: Settings2, permission: null },
            ],
        },
        {
            label: 'Gestão do Sistema',
            items: [
                { name: 'Utilizadores', href: '/core/users', icon: Users, permission: PERMISSIONS.USER_VIEW },
                { name: 'Funções & Acesso', href: '/core/roles', icon: ShieldCheck, permission: PERMISSIONS.ROLE_VIEW },
                { name: 'Subscrição', href: '/core/subscription', icon: CreditCard, permission: PERMISSIONS.BILLING_REPORT_VIEW },
                { name: 'Configurações', href: '/core/settings', icon: Settings2, permission: PERMISSIONS.SETTING_VIEW },
            ],
        },
    ],
};