'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Scale, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useIncomeStatement } from '@/hooks/module/accounting';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import { accountingReportService } from '@/services/module/accounting/report.service';

const fmt = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);

export default function IncomeStatementPage() {
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const { data: statement, isLoading, error } = useIncomeStatement({
		startDate: startDate || undefined,
		endDate: endDate || undefined,
	});

	const costs = statement?.costs || [];
	const revenues = statement?.revenues || [];
	const totals = statement?.totals;
	const isProfit = (totals?.netResult ?? 0) >= 0;

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Demonstração de Resultados</h1>
					<p className="text-slate-500 text-sm mt-1">Custos, proveitos e resultado líquido do período.</p>
				</div>
				<ExportExcelButton
					filename="demonstracao-resultados"
					fetchFile={() =>
						accountingReportService.exportIncomeStatement({
							startDate: startDate || undefined,
							endDate: endDate || undefined,
						})
					}
				/>
			</div>

			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3 flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2 text-slate-400">
						<Calendar size={15} />
						<span className="text-xs font-semibold text-slate-600">Período:</span>
					</div>
					<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 w-40 border-slate-200 rounded-sm text-xs" />
					<span className="text-slate-400 text-xs">até</span>
					<Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 w-40 border-slate-200 rounded-sm text-xs" />
				</CardContent>
			</Card>

			{isLoading ? (
				<div className="flex items-center justify-center h-48">
					<Loader2 size={28} className="text-primary animate-spin" />
				</div>
			) : error ? (
				<div className="p-6 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 flex items-center gap-3">
					<AlertCircle size={20} />
					<p className="text-sm font-medium">Erro ao carregar a demonstração de resultados.</p>
				</div>
			) : (
				<>
					{totals && (
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<Card className="border-slate-200 shadow-sm rounded-sm bg-white">
								<CardContent className="p-5 flex items-center gap-3">
									<div className="w-11 h-11 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
										<TrendingUp size={20} />
									</div>
									<div>
										<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Proveitos</p>
										<p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">{fmt(totals.revenues)}</p>
									</div>
								</CardContent>
							</Card>
							<Card className="border-slate-200 shadow-sm rounded-sm bg-white">
								<CardContent className="p-5 flex items-center gap-3">
									<div className="w-11 h-11 rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
										<TrendingDown size={20} />
									</div>
									<div>
										<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Custos</p>
										<p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">{fmt(totals.costs)}</p>
									</div>
								</CardContent>
							</Card>
							<Card className={cn('border shadow-sm rounded-sm', isProfit ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100')}>
								<CardContent className="p-5 flex items-center gap-3">
									<div className={cn('w-11 h-11 rounded-sm flex items-center justify-center shrink-0', isProfit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600')}>
										<Scale size={20} />
									</div>
									<div>
										<p className={cn('text-[10px] font-bold uppercase tracking-widest', isProfit ? 'text-emerald-600' : 'text-rose-600')}>
											Resultado Líquido
										</p>
										<p className={cn('text-xl font-black mt-0.5 tabular-nums', isProfit ? 'text-emerald-700' : 'text-rose-700')}>
											{fmt(totals.netResult)}
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
							<div className="px-5 py-3 bg-emerald-50/70 border-b border-emerald-100">
								<span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Proveitos e Ganhos</span>
							</div>
							<table className="w-full text-left border-collapse">
								<tbody className="divide-y divide-slate-100">
									{revenues.length > 0 ? (
										revenues.map((row) => (
											<tr key={row.accountId} className="hover:bg-slate-50/50">
												<td className="px-5 py-3 whitespace-nowrap">
													<span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">{row.code}</span>
												</td>
												<td className="px-3 py-3 text-sm font-medium text-slate-900 w-full">{row.name}</td>
												<td className="px-5 py-3 whitespace-nowrap text-right tabular-nums text-sm font-bold text-slate-900">{fmt(row.amount)}</td>
											</tr>
										))
									) : (
										<tr><td className="px-5 py-10 text-center text-sm text-slate-400">Sem proveitos no período</td></tr>
									)}
								</tbody>
							</table>
						</div>

						<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
							<div className="px-5 py-3 bg-rose-50/70 border-b border-rose-100">
								<span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Custos e Perdas</span>
							</div>
							<table className="w-full text-left border-collapse">
								<tbody className="divide-y divide-slate-100">
									{costs.length > 0 ? (
										costs.map((row) => (
											<tr key={row.accountId} className="hover:bg-slate-50/50">
												<td className="px-5 py-3 whitespace-nowrap">
													<span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">{row.code}</span>
												</td>
												<td className="px-3 py-3 text-sm font-medium text-slate-900 w-full">{row.name}</td>
												<td className="px-5 py-3 whitespace-nowrap text-right tabular-nums text-sm font-bold text-slate-900">{fmt(row.amount)}</td>
											</tr>
										))
									) : (
										<tr><td className="px-5 py-10 text-center text-sm text-slate-400">Sem custos no período</td></tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
