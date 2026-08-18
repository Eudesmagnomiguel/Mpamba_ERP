'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAccountLedger } from '@/hooks/module/accounting';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import { accountingReportService } from '@/services/module/accounting/report.service';

const fmt = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);

export default function AccountLedgerPage() {
	const params = useParams<{ accountId: string }>();
	const router = useRouter();
	const accountId = params.accountId;

	const { data: ledger, isLoading, error } = useAccountLedger(accountId);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 rounded-sm shrink-0" onClick={() => router.push('/contabilidade/accounts')}>
					<ArrowLeft size={16} />
				</Button>
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
						Razão {ledger?.account ? `— ${ledger.account.code} · ${ledger.account.name}` : ''}
					</h1>
					<p className="text-slate-500 text-sm mt-1">Histórico cronológico de lançamentos e saldo corrente da conta.</p>
				</div>
				<ExportExcelButton
					className="ml-auto shrink-0"
					filename={`extrato-${ledger?.account?.code ?? 'conta'}`}
					disabled={!accountId}
					fetchFile={() => accountingReportService.exportLedger(accountId)}
				/>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center h-48">
					<Loader2 size={28} className="text-primary animate-spin" />
				</div>
			) : error ? (
				<div className="p-6 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 flex items-center gap-3">
					<AlertCircle size={20} />
					<p className="text-sm font-medium">Erro ao carregar o razão da conta.</p>
				</div>
			) : (
				<>
					<Card className="border-slate-200 shadow-sm rounded-sm bg-white">
						<CardContent className="p-5 flex items-center justify-between">
							<div>
								<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Final</p>
								<p className={cn('text-2xl font-black tracking-tight mt-1 tabular-nums', (ledger?.closingBalance ?? 0) >= 0 ? 'text-slate-900' : 'text-rose-600')}>
									{fmt(ledger?.closingBalance ?? 0)}
								</p>
							</div>
							<div className="w-11 h-11 rounded-sm bg-primary/5 text-primary flex items-center justify-center">
								<BookOpen size={20} />
							</div>
						</CardContent>
					</Card>

					<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="bg-slate-50/70 border-b border-slate-200">
										<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data</th>
										<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Número</th>
										<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
										<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Débito</th>
										<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Crédito</th>
										<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{(ledger?.rows.length ?? 0) > 0 ? (
										ledger!.rows.map((row) => (
											<tr key={row.entryId} className="hover:bg-slate-50/50 transition-colors">
												<td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-700">{new Date(row.date).toLocaleDateString('pt-AO')}</td>
												<td className="px-6 py-3.5 whitespace-nowrap">
													<span className="font-mono text-xs font-bold text-slate-500">{row.number || '—'}</span>
												</td>
												<td className="px-6 py-3.5">
													<span className="text-sm font-medium text-slate-900">{row.description}</span>
													{row.sourceReference && (
														<div className="text-[10px] font-mono text-slate-400 mt-0.5">{row.sourceReference}</div>
													)}
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
											<td colSpan={6} className="px-6 py-20 text-center">
												<div className="flex flex-col items-center gap-2">
													<div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center text-slate-300">
														<BookOpen size={22} />
													</div>
													<div className="text-slate-500 font-medium text-sm">Sem movimentos nesta conta</div>
												</div>
											</td>
										</tr>
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
