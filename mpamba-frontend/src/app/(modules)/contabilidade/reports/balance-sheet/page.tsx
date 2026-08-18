'use client';

import React, { useState } from 'react';
import { Landmark, Loader2, AlertCircle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useBalanceSheet } from '@/hooks/module/accounting';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import { accountingReportService } from '@/services/module/accounting/report.service';

const fmt = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);

function BalanceColumn({ title, rows, total, accent }: { title: string; rows: { accountId: string; code: string; name: string; balance: number }[]; total: number; accent: string }) {
	return (
		<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
			<div className={cn('px-5 py-3 border-b', accent)}>
				<span className="text-xs font-bold uppercase tracking-wider">{title}</span>
			</div>
			<table className="w-full text-left border-collapse flex-1">
				<tbody className="divide-y divide-slate-100">
					{rows.length > 0 ? (
						rows.map((row) => (
							<tr key={row.accountId} className="hover:bg-slate-50/50">
								<td className="px-5 py-3 whitespace-nowrap">
									<span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">{row.code}</span>
								</td>
								<td className="px-3 py-3 text-sm font-medium text-slate-900 w-full">{row.name}</td>
								<td className="px-5 py-3 whitespace-nowrap text-right tabular-nums text-sm font-bold text-slate-900">{fmt(row.balance)}</td>
							</tr>
						))
					) : (
						<tr><td className="px-5 py-10 text-center text-sm text-slate-400">Sem saldos</td></tr>
					)}
				</tbody>
				<tfoot>
					<tr className="bg-slate-50/70 border-t border-slate-200">
						<td colSpan={2} className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Total</td>
						<td className="px-5 py-3 whitespace-nowrap text-right tabular-nums text-sm font-black text-slate-900">{fmt(total)}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	);
}

export default function BalanceSheetPage() {
	const [asOfDate, setAsOfDate] = useState('');

	const { data: sheet, isLoading, error } = useBalanceSheet({ asOfDate: asOfDate || undefined });

	const assets = sheet?.assets || [];
	const liabilities = sheet?.liabilities || [];
	const equity = sheet?.equity || [];
	const totals = sheet?.totals;
	const totalLiabilitiesEquity = (liabilities.reduce((s, r) => s + r.balance, 0)) + (equity.reduce((s, r) => s + r.balance, 0));

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Balanço</h1>
					<p className="text-slate-500 text-sm mt-1">Ativo, Passivo e Capital Próprio num ponto no tempo.</p>
				</div>
				<ExportExcelButton
					filename="balanco"
					fetchFile={() =>
						accountingReportService.exportBalanceSheet({ asOfDate: asOfDate || undefined })
					}
				/>
			</div>

			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3 flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2 text-slate-400">
						<Calendar size={15} />
						<span className="text-xs font-semibold text-slate-600">Data de referência:</span>
					</div>
					<Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="h-9 w-40 border-slate-200 rounded-sm text-xs" />
					<span className="text-[10px] text-slate-400">(vazio = hoje)</span>
				</CardContent>
			</Card>

			{isLoading ? (
				<div className="flex items-center justify-center h-48">
					<Loader2 size={28} className="text-primary animate-spin" />
				</div>
			) : error ? (
				<div className="p-6 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 flex items-center gap-3">
					<AlertCircle size={20} />
					<p className="text-sm font-medium">Erro ao carregar o balanço.</p>
				</div>
			) : (
				<>
					{totals && (
						<Card className={cn('border shadow-sm rounded-sm', totals.balanced ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100')}>
							<CardContent className="p-5 flex items-center gap-3">
								{totals.balanced ? <CheckCircle size={22} className="text-emerald-600" /> : <XCircle size={22} className="text-rose-600" />}
								<div>
									<p className={cn('text-[10px] font-bold uppercase tracking-widest', totals.balanced ? 'text-emerald-600' : 'text-rose-600')}>
										{totals.balanced ? 'Balanço Fechado' : 'Balanço Desfasado'}
									</p>
									<p className="text-xs text-slate-500 mt-0.5">
										Ativo {fmt(totals.assets)} {totals.balanced ? '=' : '≠'} Passivo + Capital Próprio {fmt(totalLiabilitiesEquity)}
									</p>
								</div>
							</CardContent>
						</Card>
					)}

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						<BalanceColumn title="Ativo" rows={assets} total={totals?.assets ?? 0} accent="bg-blue-50/70 border-blue-100 text-blue-700" />
						<div className="space-y-5">
							<BalanceColumn title="Passivo" rows={liabilities} total={liabilities.reduce((s, r) => s + r.balance, 0)} accent="bg-amber-50/70 border-amber-100 text-amber-700" />
							<BalanceColumn title="Capital Próprio" rows={equity} total={equity.reduce((s, r) => s + r.balance, 0)} accent="bg-violet-50/70 border-violet-100 text-violet-700" />
						</div>
					</div>
				</>
			)}
		</div>
	);
}
