import {
    PiggyBank,
    LayoutDashboard,
    Lock,
    Users,
    ShieldCheck,
    CreditCard,
    Box,
    Layers,
    ArrowRightLeft,
    WalletCards,
    ReceiptText,
    Tags,
    Settings2,
    Landmark,
} from 'lucide-react';
import icon from '@/assets/images/icon/icon4.png';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import { LayoutConfig } from './LayoutContext';

export const treasuryConfig: LayoutConfig = {
    logo: icon,
    rootHref: '/treasury',
    settingsHref: '/core/settings',

    routeLabels: {
        treasury: 'Início',
        accounts: 'Contas',
        reports: 'Relatórios',
        'bank-reconciliation': 'Reconciliação Bancária',
        settings: 'Configurações',
        profile: 'Perfil',
    },

    groups: [
        {
            label: 'Geral',
            items: [
                { name: 'Visão Geral', href: '/treasury', icon: LayoutDashboard, permission: null },
            ],
        },
        {
            label: 'Tesouraria',
            items: [
                { name: 'Contas', href: '/treasury/accounts', icon: PiggyBank, permission: PERMISSIONS.TREASURY_ACCOUNT_VIEW },
                { name: 'Categorias', href: '/treasury/categories', icon: Layers, permission: PERMISSIONS.TREASURY_CATEGORY_VIEW },
                { name: 'Movimentos', href: '/treasury/movements', icon: ArrowRightLeft, permission: PERMISSIONS.TREASURY_TRANSACTION_VIEW },
                { name: 'Reconciliação Bancária', href: '/treasury/bank-reconciliation', icon: Landmark, permission: PERMISSIONS.TREASURY_ACCOUNT_VIEW },
            ],
        },
        {
            label: 'Obrigações',
            items: [
                { name: 'A Receber', href: '/treasury/receivables', icon: ReceiptText, permission: PERMISSIONS.TREASURY_TRANSACTION_VIEW },
                { name: 'A Pagar', href: '/treasury/payables', icon: WalletCards, permission: PERMISSIONS.TREASURY_TRANSACTION_VIEW },
                { name: 'Centros Custo', href: '/treasury/cost-centers', icon: Tags, permission: PERMISSIONS.TREASURY_CATEGORY_VIEW },
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