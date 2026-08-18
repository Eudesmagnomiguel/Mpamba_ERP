'use client';

import {
	BookOpen,
	ListTree,
	Scale,
	AlertCircle,
	Plus,
	ArrowRight,
	CheckCircle,
	XCircle,
	Zap,
	UserRound,
	BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAccountingAccounts, useJournalEntries, useTrialBalance } from '@/hooks/module/accounting';

const fmt = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', notation: 'compact', compactDisplay: 'short' }).format(v);

export default function AccountingPage() {
	const { data: accounts, isLoading: loadingAccounts } = useAccountingAccounts();
	const { data: entriesData, isLoading: loadingEntries } = useJournalEntries({ page: 1, pageSize: 5 });
	const { data: trialBalance, isLoading: loadingBalance, error } = useTrialBalance();

	const isLoading = loadingAccounts || loadingEntries || loadingBalance;
	const recentEntries = entriesData?.data || [];
	const totals = trialBalance?.totals;

	const topAccountsChartData = (trialBalance?.rows || [])
		.slice()
		.sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit))
		.slice(0, 6)
		.map((r) => ({ name: `${r.code}`, Débito: r.debit, Crédito: r.credit }));

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
				<p className="font-medium">Erro ao carregar os dados de contabilidade.</p>
			</div>
		);
	}

	const kpis = [
		{
			label: 'Contas Activas',
			value: (accounts || []).filter((a) => a.isActive).length,
			sub: 'No plano de contas',
			icon: ListTree,
		},
		{
			label: 'Lançamentos',
			value: entriesData?.pagination?.total ?? 0,
			sub: 'Registados no total',
			icon: BookOpen,
		},
		{
			label: 'Total Débito',
			value: fmt(totals?.debit ?? 0),
			sub: 'Acumulado',
			icon: Scale,
		},
		{
			label: 'Situação',
			value: totals?.balanced ? 'Fechado' : 'Aberto',
			sub: totals?.balanced ? 'Débito = Crédito' : 'Verificar lançamentos',
			icon: totals?.balanced ? CheckCircle : XCircle,
			valueColor: totals?.balanced ? 'text-emerald-500' : 'text-rose-500',
		},
	];

	return (
		<div className="space-y-6 animate-in fade-in duration-700 pb-12">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden group">
				<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

				<div className="relative z-10">
					<div className="flex items-center gap-2 mb-1">
						<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
					</div>
					<h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard de Contabilidade</h1>
					<p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">Plano de contas, lançamentos e balancete</p>
				</div>

				<div className="flex items-center gap-3 relative z-10">
					<Button asChild variant="outline" className="h-11 px-6 rounded-sm border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
						<Link href="/contabilidade/reports/trial-balance">
							<Scale size={14} className="mr-2" />
							Balancete
						</Link>
					</Button>
					<Button asChild className="h-11 px-8 bg-primary hover:bg-primary-hover text-white rounded-sm font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center gap-2">
						<Link href="/contabilidade/entries">
							<Plus size={14} />
							Novo Lançamento
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
				{kpis.map((kpi, idx) => {
					const Icon = kpi.icon;
					return (
						<div key={kpi.label} className={cn(
							'p-6 border-b border-slate-100 transition-all hover:bg-slate-50/50 group',
							idx !== 3 && 'sm:border-r',
							(idx === 0 || idx === 1) && 'lg:border-b-0',
							idx === 2 && 'sm:border-b-0 lg:border-b-0'
						)}>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
									<Icon size={20} />
								</div>
								<p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{kpi.label}</p>
							</div>
							<div className="mt-4">
								<h3 className={cn('text-xl font-black tracking-tight truncate', kpi.valueColor || 'text-slate-900')}>{kpi.value}</h3>
								<div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
									<span>{kpi.sub}</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				<div className="xl:col-span-2 space-y-6">
					<Card className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
						<CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6 border-b border-slate-50">
							<CardTitle className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
								<BarChart3 size={16} className="text-primary" />
								Débito vs Crédito — Contas Mais Movimentadas
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6">
							{topAccountsChartData.length > 0 ? (
								<div className="h-[240px] w-full">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={topAccountsChartData}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
											<XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 800 }} />
											<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 800 }} tickFormatter={(v) => fmt(v)} />
											<Tooltip
												contentStyle={{ borderRadius: '4px', border: '1px solid #F1F5F9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', fontSize: '11px', fontWeight: 700 }}
												formatter={(value: any) => fmt(Number(value))}
											/>
											<Legend wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
											<Bar dataKey="Débito" fill="#1E2124" radius={[3, 3, 0, 0]} maxBarSize={26} />
											<Bar dataKey="Crédito" fill="#C4643A" radius={[3, 3, 0, 0]} maxBarSize={26} />
										</BarChart>
									</ResponsiveContainer>
								</div>
							) : (
								<div className="h-[240px] flex flex-col items-center justify-center text-slate-400 gap-2">
									<BarChart3 size={24} className="opacity-40" />
									<p className="text-[10px] font-black uppercase tracking-widest">Sem movimentos ainda</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
						<CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6 border-b border-slate-50">
							<CardTitle className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
								<BookOpen size={16} className="text-primary" />
								Lançamentos Recentes
							</CardTitle>
							<Link href="/contabilidade/entries" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline">
								Ver todos <ArrowRight size={12} />
							</Link>
						</CardHeader>
						<CardContent className="p-0">
							{recentEntries.length > 0 ? (
								recentEntries.map((entry) => {
									const total = entry.lines.reduce((s, l) => s + l.debit, 0);
									return (
										<div key={entry.id} className="flex items-center justify-between p-5 border-b border-slate-50 last:border-0">
											<div className="flex items-center gap-3 min-w-0">
												<div className={cn(
													'w-9 h-9 rounded-sm flex items-center justify-center shrink-0',
													entry.source === 'AUTOMATIC' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
												)}>
													{entry.source === 'AUTOMATIC' ? <Zap size={15} /> : <UserRound size={15} />}
												</div>
												<div className="min-w-0">
													<p className="text-sm font-semibold text-slate-900 truncate">{entry.description}</p>
													<p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{entry.number} · {new Date(entry.date).toLocaleDateString('pt-AO')}</p>
												</div>
											</div>
											<span className="text-sm font-bold tabular-nums text-slate-900 shrink-0">{fmt(total)}</span>
										</div>
									);
								})
							) : (
								<div className="py-16 flex flex-col items-center gap-2 text-slate-400">
									<BookOpen size={28} className="opacity-30" />
									<p className="text-sm font-medium text-slate-500">Nenhum lançamento ainda</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
						<CardHeader className="pb-4 px-6 pt-6 border-b border-slate-50">
							<CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Painel de Operações</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							{[
								{ name: 'Plano de Contas', sub: 'Gerir estrutura contabilística', icon: ListTree, href: '/contabilidade/accounts' },
								{ name: 'Lançamentos', sub: 'Ver e criar lançamentos', icon: BookOpen, href: '/contabilidade/entries' },
								{ name: 'Balancete', sub: 'Saldos por conta', icon: Scale, href: '/contabilidade/reports/trial-balance' },
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

					<div className="flex items-start gap-3.5 p-4 bg-violet-50 border border-violet-100 rounded-sm">
						<div className="p-2 bg-violet-100 rounded-sm shrink-0">
							<Zap size={16} className="text-violet-600" />
						</div>
						<div>
							<p className="text-[10px] font-black text-violet-800 uppercase tracking-widest mb-0.5">Lançamentos Automáticos</p>
							<p className="text-[11px] text-violet-700 leading-relaxed font-medium">
								Faturas, recibos, notas de crédito e anulações são lançados automaticamente em partidas dobradas.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
