'use client';

import React, { useState } from 'react';
import { Scale, Loader2, AlertCircle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTrialBalance } from '@/hooks/module/accounting';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import { accountingReportService } from '@/services/module/accounting/report.service';

const fmt = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);

export default function TrialBalancePage() {
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const { data: trialBalance, isLoading, error } = useTrialBalance({
		startDate: startDate || undefined,
		endDate: endDate || undefined,
	});

	const rows = trialBalance?.rows || [];
	const totals = trialBalance?.totals;

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Balancete</h1>
					<p className="text-slate-500 text-sm mt-1">Saldos de débito e crédito de todas as contas movimentadas.</p>
				</div>
				<ExportExcelButton
					filename="balancete"
					fetchFile={() =>
						accountingReportService.exportTrialBalance({
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

			{totals && (
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Card className="border-slate-200 shadow-sm rounded-sm bg-white">
						<CardContent className="p-5">
							<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Débito</p>
							<p className="text-xl font-black text-slate-900 mt-1 tabular-nums">{fmt(totals.debit)}</p>
						</CardContent>
					</Card>
					<Card className="border-slate-200 shadow-sm rounded-sm bg-white">
						<CardContent className="p-5">
							<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Crédito</p>
							<p className="text-xl font-black text-slate-900 mt-1 tabular-nums">{fmt(totals.credit)}</p>
						</CardContent>
					</Card>
					<Card className={cn('border shadow-sm rounded-sm', totals.balanced ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100')}>
						<CardContent className="p-5 flex items-center gap-3">
							{totals.balanced ? <CheckCircle size={22} className="text-emerald-600" /> : <XCircle size={22} className="text-rose-600" />}
							<div>
								<p className={cn('text-[10px] font-bold uppercase tracking-widest', totals.balanced ? 'text-emerald-600' : 'text-rose-600')}>
									{totals.balanced ? 'Balancete Fechado' : 'Balancete Desfasado'}
								</p>
								<p className="text-xs text-slate-500 mt-0.5">Débito {totals.balanced ? '=' : '≠'} Crédito</p>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50/70 border-b border-slate-200">
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Código</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conta</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Débito</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Crédito</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading ? (
								<tr>
									<td colSpan={5} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3">
											<Loader2 size={28} className="text-primary animate-spin" />
											<p className="text-sm font-medium text-slate-500">A calcular o balancete...</p>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={5} className="px-6 py-20 text-center text-rose-500">
										<AlertCircle size={28} className="mx-auto" />
										<p className="text-sm font-medium mt-2">Erro ao carregar o balancete.</p>
									</td>
								</tr>
							) : rows.length > 0 ? (
								rows.map((row) => (
									<tr key={row.accountId} className="hover:bg-slate-50/50 transition-colors">
										<td className="px-6 py-3.5 whitespace-nowrap">
											<span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">{row.code}</span>
										</td>
										<td className="px-6 py-3.5">
											<span className="text-sm font-medium text-slate-900">{row.name}</span>
										</td>
										<td className="px-6 py-3.5 whitespace-nowrap text-right tabular-nums text-sm text-slate-700">{row.debit > 0 ? fmt(row.debit) : '—'}</td>
										<td className="px-6 py-3.5 whitespace-nowrap text-right tabular-nums text-sm text-slate-700">{row.credit > 0 ? fmt(row.credit) : '—'}</td>
										<td className={cn('px-6 py-3.5 whitespace-nowrap text-right tabular-nums text-sm font-bold', row.balance >= 0 ? 'text-slate-900' : 'text-rose-600')}>
											{fmt(row.balance)}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-2">
											<div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center text-slate-300">
												<Scale size={22} />
											</div>
											<div className="text-slate-500 font-medium text-sm">Sem movimentos no período</div>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
