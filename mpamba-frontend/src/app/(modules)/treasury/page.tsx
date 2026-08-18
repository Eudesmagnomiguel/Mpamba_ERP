'use client';

import {
	Wallet,
	ArrowUpRight,
	ArrowDownLeft,
	TrendingUp,
	AlertCircle,
	Plus,
	BarChart3,
	Building2,
	Tag,
	ArrowLeftRight,
	Link2,
	Receipt,
	Package,
	ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTreasurySummary } from '@/hooks/module/treasury';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import { reportService } from '@/services/module/treasury/report.service';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { getApiErrorMessage } from '@/shared/utils/api-error.utils';
import {
	AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
	PieChart, Pie, Cell,
} from 'recharts';

const fmt = (v: number) =>
	new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', notation: 'compact', compactDisplay: 'short' }).format(v);

export default function TreasuryPage() {
	const { data: summary, isLoading, error } = useTreasurySummary();
	const { hasBillingAndTreasury, hasStockAndTreasury } = useModuleAccess();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 flex items-center gap-3">
				<AlertCircle size={24} />
				<p className="font-medium">{getApiErrorMessage(error, 'Erro ao carregar os dados da tesouraria.')}</p>
			</div>
		);
	}

	const stats = summary || {
		totalBalance: 0,
		totalIncomes: 0,
		totalExpenses: 0,
		evolutionData: [],
		categoryData: [],
		accountsBalance: [],
	};

	const kpis = [
		{
			label: 'Saldo Total',
			value: fmt(stats.totalBalance),
			sub: 'Disponível em contas',
			icon: Wallet,
			iconBg: 'text-primary',
			valueColor: 'text-slate-900',
		},
		{
			label: 'Receitas',
			value: fmt(stats.totalIncomes),
			sub: 'Entradas no período',
			icon: ArrowUpRight,
			iconBg: 'text-emerald-500',
			valueColor: 'text-slate-900',
		},
		{
			label: 'Despesas',
			value: fmt(stats.totalExpenses),
			sub: 'Saídas no período',
			icon: ArrowDownLeft,
			iconBg: 'text-rose-500',
			valueColor: 'text-slate-900',
		},
		{
			label: 'Saldo Líquido',
			value: fmt(stats.totalIncomes - stats.totalExpenses),
			sub: 'Receitas menos Despesas',
			icon: TrendingUp,
			iconBg: 'text-blue-500',
			valueColor: stats.totalIncomes - stats.totalExpenses >= 0 ? 'text-emerald-500' : 'text-rose-500',
		},
	];

	return (
		<div className="space-y-6 animate-in fade-in duration-700 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden group">
				<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
				
				<div className="relative z-10">
					<div className="flex items-center gap-2 mb-1">
						<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
					</div>
					<h1 className="text-2xl font-black text-slate-900 tracking-tight">
						Dashboard de Tesouraria
					</h1>
					<p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">Gestão de fluxo de caixa e movimentos financeiros</p>
				</div>

				<div className="flex items-center gap-3 relative z-10">
					<ExportExcelButton
						filename="resumo-tesouraria"
						label="Relatório"
						className="h-11 px-6 rounded-sm border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
						fetchFile={() => reportService.exportSummary()}
					/>
					<Button asChild className="h-11 px-8 bg-primary hover:bg-primary-hover text-white rounded-sm font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center gap-2">
						<Link href="/treasury/movements">
							<Plus size={14} />
							Novo Movimento
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				<div className="xl:col-span-2 space-y-6">
					{/* KPI Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
						{kpis.map((kpi, idx) => {
							const Icon = kpi.icon;
							return (
								<div key={kpi.label} className={cn(
									"p-6 border-b border-slate-100 transition-all hover:bg-slate-50/50 group",
									idx !== 3 && "sm:border-r",
									(idx === 0 || idx === 1) && "lg:border-b-0",
									idx === 2 && "sm:border-b-0 lg:border-b-0"
								)}>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
											<Icon size={20} className={kpi.iconBg} />
										</div>
										<p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{kpi.label}</p>
									</div>
									<div className="mt-4">
										<h3 className={cn("text-xl font-black tracking-tight truncate", kpi.valueColor)}>{kpi.value}</h3>
										<div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
											<span>{kpi.sub}</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Integration Banners */}
					{(hasBillingAndTreasury || hasStockAndTreasury) && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{hasBillingAndTreasury && (
								<div className="flex items-start gap-3.5 p-4 bg-emerald-50 border border-emerald-100 rounded-sm">
									<div className="p-2 bg-emerald-100 rounded-sm shrink-0">
										<Receipt size={16} className="text-emerald-600" />
									</div>
									<div>
										<p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
											<Link2 size={11} /> Faturação Integrada
										</p>
										<p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
											Os recibos emitidos na Faturação geram automaticamente entradas nesta tesouraria.
										</p>
									</div>
								</div>
							)}
							{hasStockAndTreasury && (
								<div className="flex items-start gap-3.5 p-4 bg-blue-50 border border-blue-100 rounded-sm">
									<div className="p-2 bg-blue-100 rounded-sm shrink-0">
										<Package size={16} className="text-blue-600" />
									</div>
									<div>
										<p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
											<Link2 size={11} /> Stock Integrado
										</p>
										<p className="text-[11px] text-blue-700 leading-relaxed font-medium">
											Entradas de stock de fornecedores são sinalizadas. Registe a despesa manualmente.
										</p>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Main Chart */}
					<Card className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
						<CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50 px-6 py-5">
							<CardTitle className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
								<BarChart3 size={16} className="text-primary" />
								Evolução Financeira
							</CardTitle>
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-1.5">
									<div className="w-2 h-2 rounded-full bg-emerald-500" />
									<span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receitas</span>
								</div>
								<div className="flex items-center gap-1.5">
									<div className="w-2 h-2 rounded-full bg-rose-400" />
									<span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Despesas</span>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-8">
							<div className="h-[320px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={stats.evolutionData}>
										<defs>
											<linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
												<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
											</linearGradient>
											<linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
												<stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
										<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} dy={15} />
										<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} tickFormatter={(v) => `${v / 1000}k`} dx={-10} />
										<RechartsTooltip
											contentStyle={{ borderRadius: '2px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}
											itemStyle={{ fontWeight: '800' }}
										/>
										<Area type="monotone" dataKey="incomes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#incomeGrad)" animationDuration={2000} />
										<Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#expenseGrad)" animationDuration={2000} />
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					{/* Premium Summary Card */}
					<Card className="border-none shadow-xl shadow-primary/10 rounded-sm bg-primary text-white overflow-hidden relative group">
						<div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
							<Wallet size={120} />
						</div>
						<div className="absolute bottom-0 left-0 w-full h-1 bg-white/20" />
						
						<CardContent className="p-8 relative z-10">
							<div className="flex items-center gap-2 mb-4">
								<div className="w-2 h-2 rounded-full bg-white animate-pulse" />
								<p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Posição Global</p>
							</div>
							<div className="flex items-baseline gap-2">
								<h2 className="text-3xl font-black tracking-tight leading-none">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(stats.totalBalance).replace('Kz', '').trim()}</h2>
								<span className="text-xs font-bold text-white/40 uppercase tracking-widest">Kz</span>
							</div>
							<p className="text-[11px] mt-4 text-white/50 leading-relaxed font-bold uppercase tracking-wide">
								Saldo total consolidado disponível em todas as contas ativas.
							</p>
							<Button 
								variant="ghost"
								asChild
								className="mt-8 w-full bg-white/10 hover:bg-white text-primary rounded-sm text-[10px] font-black uppercase tracking-widest h-12 border border-white/10 transition-all shadow-lg shadow-black/5"
							>
								<Link href="/treasury/accounts">
									Gerir Contas
									<ArrowRight size={14} className="ml-2" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Quick Actions Panel */}
					<Card className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
						<CardHeader className="pb-4 px-6 pt-6 border-b border-slate-50">
							<CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Painel de Operações</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							{[
								{ name: 'Registar Movimento', sub: 'Nova receita ou despesa', icon: ArrowLeftRight, href: '/treasury/movements' },
								{ name: 'Contas Bancárias', sub: 'Gerir saldos e contas', icon: Building2, href: '/treasury/accounts' },
								{ name: 'Categorias', sub: 'Organizar fluxos financeiros', icon: Tag, href: '/treasury/categories' },
							].map((action, i) => (
								<Link href={action.href} key={i}>
									<div className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-0">
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
												<action.icon size={18} />
											</div>
											<div className="text-left">
												<div className="text-xs font-black text-slate-900 uppercase tracking-tight">{action.name}</div>
												<div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{action.sub}</div>
											</div>
										</div>
										<ArrowRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
									</div>
								</Link>
							))}
						</CardContent>
					</Card>

					{/* Category Donut */}
					<Card className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
						<CardHeader className="pb-4 px-6 pt-6 border-b border-slate-50">
							<CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Por Categoria</CardTitle>
						</CardHeader>
						<CardContent className="p-6">
							{stats.categoryData.length > 0 ? (
								<>
									<div className="h-[180px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<PieChart>
												<Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
													{stats.categoryData.map((entry, index) => (
														<Cell key={`cell-${index}`} fill={entry.color || 'var(--primary)'} />
													))}
												</Pie>
												<RechartsTooltip contentStyle={{ borderRadius: '2px', fontSize: '11px', fontWeight: '800', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
											</PieChart>
										</ResponsiveContainer>
									</div>
									<div className="mt-4 space-y-2">
										{stats.categoryData.map((cat, i) => (
											<div key={i} className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
													<span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest truncate">{cat.name}</span>
												</div>
												<span className="text-[10px] font-black text-slate-900">{cat.value}%</span>
											</div>
										))}
									</div>
								</>
							) : (
								<div className="h-[180px] flex flex-col items-center justify-center text-slate-400 gap-2">
									<Tag size={24} className="opacity-40" />
									<p className="text-[10px] font-black uppercase tracking-widest">Sem dados</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

