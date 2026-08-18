import {
    LayoutDashboard,
    Users,
    Building2,
    UserCog,
    KeyRound,
    Layers,
    Settings,
    CreditCard,
    Blocks,
    Megaphone,
} from 'lucide-react';
import icon from '@/assets/images/icon/icon4.png';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import { LayoutConfig } from '../../../../components/layout/module/LayoutContext';

export const adminConfig: LayoutConfig = {
    logo: icon,
    rootHref: '/admin/dashboard',
    settingsHref: '/admin/settings',

    routeLabels: {
        admin: 'Administração',
        dashboard: 'Dashboard',
        users: 'Usuários',
        plans: 'Planos',
        subscriptions: 'Subscrições',
        organizations: 'Organizações',
        permissions: 'Permissões',
        roles: 'Papéis',
        modules: 'Módulos',
        notifications: 'Notificações',
        settings: 'Configurações',
        profile: 'Perfil',
    },

    groups: [
        {
            label: 'Geral',
            items: [
                { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
            ],
        },
        {
            label: 'Gestão de Plataforma',
            items: [
                { name: 'Usuários', href: '/admin/users', icon: Users, permission: PERMISSIONS.USER_VIEW },
                { name: 'Papéis', href: '/admin/roles', icon: UserCog, permission: PERMISSIONS.ROLE_VIEW },
                { name: 'Permissões', href: '/admin/permissions', icon: KeyRound, permission: PERMISSIONS.PERMISSION_VIEW },
                { name: 'Planos', href: '/admin/plans', icon: Layers, permission: PERMISSIONS.PLAN_VIEW },
                { name: 'Módulos', href: '/admin/modules', icon: Blocks, permission: PERMISSIONS.MODULE_VIEW },
            ],
        },
        {
            label: 'Administração',
            items: [
                { name: 'Organizações', href: '/admin/organizations', icon: Building2, permission: PERMISSIONS.ORGANIZATION_VIEW },
                { name: 'Subscrições', href: '/admin/subscriptions', icon: CreditCard, permission: PERMISSIONS.ORGANIZATION_VIEW },
                { name: 'Notificações', href: '/admin/notifications', icon: Megaphone, permission: PERMISSIONS.NOTIFICATION_SEND },
                { name: 'Configurações', href: '/admin/settings', icon: Settings, permission: null },
            ],
        },
    ],
};