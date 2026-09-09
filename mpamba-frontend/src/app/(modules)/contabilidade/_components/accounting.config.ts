import {
	LayoutDashboard,
	BookOpen,
	ListTree,
	BookMarked,
	Scale,
	TrendingUp,
	Landmark,
	Users,
	ShieldCheck,
	CreditCard,
	Settings2,
} from 'lucide-react';
import icon from '@/assets/images/icon/icon4.png';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import { LayoutConfig } from '@/components/layout/module/LayoutContext';

export const accountingConfig: LayoutConfig = {
	logo: icon,
	rootHref: '/contabilidade',
	settingsHref: '/core/settings',

	routeLabels: {
		contabilidade: 'Início',
		accounts: 'Plano de Contas',
		pgc: 'PGC (Decreto 82/01)',
		entries: 'Lançamentos',
		reports: 'Relatórios',
		'trial-balance': 'Balancete',
		'income-statement': 'Demonstração de Resultados',
		'balance-sheet': 'Balanço',
		ledger: 'Razão',
		settings: 'Configurações',
		profile: 'Perfil',
	},

	groups: [
		{
			label: 'Geral',
			items: [
				{ name: 'Visão Geral', href: '/contabilidade', icon: LayoutDashboard, permission: null },
			],
		},
		{
			label: 'Contabilidade',
			items: [
				{ name: 'Plano de Contas', href: '/contabilidade/accounts', icon: ListTree, permission: PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW },
				{ name: 'PGC (Decreto 82/01)', href: '/contabilidade/pgc', icon: BookMarked, permission: PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW },
				{ name: 'Lançamentos', href: '/contabilidade/entries', icon: BookOpen, permission: PERMISSIONS.ACCOUNTING_ENTRY_VIEW },
				{ name: 'Balancete', href: '/contabilidade/reports/trial-balance', icon: Scale, permission: PERMISSIONS.ACCOUNTING_REPORT_VIEW },
				{ name: 'Demonstração de Resultados', href: '/contabilidade/reports/income-statement', icon: TrendingUp, permission: PERMISSIONS.ACCOUNTING_REPORT_VIEW },
				{ name: 'Balanço', href: '/contabilidade/reports/balance-sheet', icon: Landmark, permission: PERMISSIONS.ACCOUNTING_REPORT_VIEW },
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
