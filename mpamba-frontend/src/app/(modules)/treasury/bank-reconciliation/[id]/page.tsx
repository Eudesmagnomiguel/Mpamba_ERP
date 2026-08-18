'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
	ArrowLeft,
	Loader2,
	AlertCircle,
	Zap,
	Link2,
	Link2Off,
	CheckCircle2,
	CircleDashed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
	useBankStatement,
	useAutoMatchStatement,
	useManualMatchLine,
	useUnmatchLine,
	useUnmatchedMovements,
} from '@/hooks/module/treasury';

const fmt = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);

export default function BankStatementDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const statementId = params.id;
	const [selectedMovementByLine, setSelectedMovementByLine] = useState<Record<string, string>>({});

	const { data: statement, isLoading, error } = useBankStatement(statementId);
	const { data: unmatchedMovements } = useUnmatchedMovements(statementId);
	const autoMatch = useAutoMatchStatement();
	const manualMatch = useManualMatchLine();
	const unmatchLine = useUnmatchLine();

	const handleAutoMatch = async () => {
		try {
			const result = await autoMatch.mutateAsync(statementId);
			toast.success(`${result.matchedCount} de ${result.totalLines} linhas reconciliadas automaticamente.`);
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao reconciliar automaticamente.');
		}
	};

	const handleManualMatch = async (lineId: string) => {
		const movementId = selectedMovementByLine[lineId];
		if (!movementId) {
			toast.error('Selecione um movimento para ligar.');
			return;
		}
		try {
			await manualMatch.mutateAsync({ lineId, movementId, statementId });
			toast.success('Linha reconciliada.');
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao ligar o movimento.');
		}
	};

	const handleUnmatch = async (lineId: string) => {
		try {
			await unmatchLine.mutateAsync({ lineId, statementId });
			toast.success('Reconciliação desfeita.');
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao desfazer a reconciliação.');
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 size={28} className="text-primary animate-spin" />
			</div>
		);
	}

	if (error || !statement) {
		return (
			<div className="p-6 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 flex items-center gap-3">
				<AlertCircle size={20} />
				<p className="text-sm font-medium">Erro ao carregar o extrato bancário.</p>
			</div>
		);
	}

	const reconciledCount = statement.lines.filter((l) => l.isReconciled).length;
	const balanceDifference = statement.endingBalance - statement.startingBalance;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 rounded-sm shrink-0" onClick={() => router.push('/treasury/bank-reconciliation')}>
					<ArrowLeft size={16} />
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">{statement.fileName}</h1>
					<p className="text-slate-500 text-sm mt-1">
						{statement.account?.name ?? '—'} · {new Date(statement.startDate).toLocaleDateString('pt-AO')} – {new Date(statement.endDate).toLocaleDateString('pt-AO')}
					</p>
				</div>
				<Button onClick={handleAutoMatch} disabled={autoMatch.isPending} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
					{autoMatch.isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
					Auto-Match
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="border-slate-200 shadow-sm rounded-sm bg-white">
					<CardContent className="p-5">
						<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reconciliadas</p>
						<p className="text-xl font-black text-slate-900 mt-1 tabular-nums">{reconciledCount}/{statement.lines.length}</p>
					</CardContent>
				</Card>
				<Card className="border-slate-200 shadow-sm rounded-sm bg-white">
					<CardContent className="p-5">
						<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Inicial → Final</p>
						<p className="text-sm font-bold text-slate-900 mt-1 tabular-nums">{fmt(statement.startingBalance)} → {fmt(statement.endingBalance)}</p>
					</CardContent>
				</Card>
				<Card className="border-slate-200 shadow-sm rounded-sm bg-white">
					<CardContent className="p-5">
						<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Movimento do Período</p>
						<p className={cn('text-xl font-black mt-1 tabular-nums', balanceDifference >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{fmt(balanceDifference)}</p>
					</CardContent>
				</Card>
			</div>

			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50/70 border-b border-slate-200">
								<th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data</th>
								<th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
								<th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
								<th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
								<th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ação</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{statement.lines.map((line) => (
								<tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
									<td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-700">{new Date(line.date).toLocaleDateString('pt-AO')}</td>
									<td className="px-5 py-3.5">
										<span className="text-sm font-medium text-slate-900">{line.description}</span>
										{line.reference && <div className="text-[10px] font-mono text-slate-400">{line.reference}</div>}
									</td>
									<td className="px-5 py-3.5 whitespace-nowrap text-right tabular-nums text-sm font-bold text-slate-900">{fmt(line.amount)}</td>
									<td className="px-5 py-3.5 whitespace-nowrap text-center">
										{line.isReconciled ? (
											<span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">
												<CheckCircle2 size={10} /> Reconciliada
											</span>
										) : (
											<span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-200">
												<CircleDashed size={10} /> Pendente
											</span>
										)}
									</td>
									<td className="px-5 py-3.5">
										{line.isReconciled ? (
											<Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-slate-500 hover:text-rose-600 rounded-sm" onClick={() => handleUnmatch(line.id)} disabled={unmatchLine.isPending}>
												<Link2Off size={13} /> Desfazer
											</Button>
										) : (
											<div className="flex items-center gap-1.5">
												<Select onValueChange={(v) => setSelectedMovementByLine((prev) => ({ ...prev, [line.id]: v }))}>
													<SelectTrigger className="h-8 w-56 border-slate-200 rounded-sm text-xs">
														<SelectValue placeholder="Selecionar movimento..." />
													</SelectTrigger>
													<SelectContent>
														{(unmatchedMovements || []).map((mv) => (
															<SelectItem key={mv.id} value={mv.id}>
																{new Date(mv.date).toLocaleDateString('pt-AO')} · {mv.description} · {fmt(mv.amount)}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-200 rounded-sm" onClick={() => handleManualMatch(line.id)} disabled={manualMatch.isPending}>
													<Link2 size={13} /> Ligar
												</Button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
