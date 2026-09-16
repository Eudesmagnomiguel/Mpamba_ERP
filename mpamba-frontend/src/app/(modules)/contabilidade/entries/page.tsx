'use client';

import React, { useMemo, useState } from 'react';
import {
	BookOpen,
	Plus,
	Search,
	Loader2,
	AlertCircle,
	ChevronDown,
	ChevronRight,
	Undo2,
	Trash2,
	Zap,
	UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';
import { useJournalEntries, useCreateManualEntry, useReverseEntry } from '@/hooks/module/accounting';
import { useAccountingAccounts } from '@/hooks/module/accounting';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateManualEntrySchema, CreateManualEntryDto } from '@/shared/dto/accounting.dto';
import { toast } from 'sonner';

const fmt = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);

export default function JournalEntriesPage() {
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	const { data: entriesData, isLoading, error } = useJournalEntries({ page, pageSize: 20 });
	const { data: accounts } = useAccountingAccounts();
	const createEntry = useCreateManualEntry();
	const reverseEntry = useReverseEntry();

	const entries = entriesData?.data || [];
	const pagination = entriesData?.pagination;

	const filtered = search
		? entries.filter((e) => e.description.toLowerCase().includes(search.toLowerCase()) || e.number?.toLowerCase().includes(search.toLowerCase()))
		: entries;

	const form = useForm<CreateManualEntryDto>({
		resolver: zodResolver(CreateManualEntrySchema),
		defaultValues: {
			description: '',
			lines: [
				{ accountId: '', debit: 0, credit: 0 },
				{ accountId: '', debit: 0, credit: 0 },
			],
		},
	});

	// Só as contas movimentáveis entram no seletor: no PGC os lançamentos vão
	// para a conta mais desagregada, e uma conta desativada não aceita
	// movimentos. O backend recusa ambos os casos — filtrar aqui evita que o
	// utilizador só descubra o problema ao gravar.
	const movableAccounts = useMemo(() => {
		const list = accounts || [];
		const aggregatorIds = new Set(list.map((acc) => acc.parentId).filter(Boolean) as string[]);
		return list.filter((acc) => acc.isActive && !aggregatorIds.has(acc.id));
	}, [accounts]);

	const today = new Date().toISOString().slice(0, 10);

	const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });
	const watchedLines = form.watch('lines') || [];
	const totalDebit = watchedLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
	const totalCredit = watchedLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
	const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

	// O servidor recusa linhas sem conta, sem valor, ou com os dois lados
	// preenchidos. Repetir as regras aqui é o que impede o formulário de dar
	// «Balanceado ✓» a um lançamento que o servidor vai recusar — era o caso de
	// uma linha com débito e crédito iguais, que equilibra os totais sozinha.
	const lineProblem = useMemo(() => {
		for (let i = 0; i < watchedLines.length; i++) {
			const line = watchedLines[i];
			const debit = Number(line?.debit) || 0;
			const credit = Number(line?.credit) || 0;

			if (!line?.accountId) return `Linha ${i + 1}: escolha a conta.`;
			if (debit > 0 && credit > 0) return `Linha ${i + 1}: leva débito ou crédito, nunca os dois.`;
			if (debit === 0 && credit === 0) return `Linha ${i + 1}: falta o valor a débito ou a crédito.`;
		}
		return null;
	}, [watchedLines]);

	const canSubmit = isBalanced && !lineProblem;

	const toggleExpand = (id: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id); else next.add(id);
			return next;
		});
	};

	const handleCreate = form.handleSubmit(async (data) => {
		if (lineProblem) {
			toast.error(lineProblem);
			return;
		}
		if (!isBalanced) {
			toast.error('O lançamento tem de estar balanceado (débito = crédito).');
			return;
		}
		try {
			// Um input de data vazio devolve '', que o backend não consegue converter.
			// E um campo de valor vazio devolve NaN, que o JSON transforma em null:
			// normalizar para 0 aqui é o que garante que o lado não usado da linha
			// chega ao servidor como zero e não como um valor inválido.
			await createEntry.mutateAsync({
				...data,
				date: data.date || undefined,
				lines: data.lines.map((line) => ({
					...line,
					debit: Number(line.debit) || 0,
					credit: Number(line.credit) || 0,
				})),
			});
			toast.success('Lançamento registado com sucesso!');
			setIsCreateOpen(false);
			form.reset({ description: '', lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }] });
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao registar o lançamento.');
		}
	});

	const handleReverse = async (id: string) => {
		try {
			await reverseEntry.mutateAsync({ id });
			toast.success('Lançamento revertido.');
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao reverter o lançamento.');
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lançamentos Contabilísticos</h1>
					<p className="text-slate-500 text-sm mt-1">Débitos e créditos, automáticos e manuais.</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
					<Plus size={16} />
					Novo Lançamento
				</Button>
			</div>

			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3 flex gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
						<Input
							placeholder="Pesquisar por número ou descrição..."
							className="pl-9 h-10 bg-white border-slate-200 rounded-sm text-sm"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50/70 border-b border-slate-200">
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-8"></th>
								<th className="px-3 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Número</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Origem</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading ? (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3">
											<Loader2 size={28} className="text-primary animate-spin" />
											<p className="text-sm font-medium text-slate-500">A carregar lançamentos...</p>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center text-rose-500">
										<AlertCircle size={28} className="mx-auto" />
										<p className="text-sm font-medium mt-2">Erro ao carregar os lançamentos.</p>
									</td>
								</tr>
							) : filtered.length > 0 ? (
								filtered.map((entry) => {
									const total = entry.lines.reduce((s, l) => s + l.debit, 0);
									const isExpanded = expanded.has(entry.id);
									return (
										<React.Fragment key={entry.id}>
											<tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => toggleExpand(entry.id)}>
												<td className="px-6 py-4">
													{isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
												</td>
												<td className="px-3 py-4 whitespace-nowrap">
													<span className="font-mono text-xs font-bold text-slate-600">{entry.number || '—'}</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className="text-sm text-slate-700">{new Date(entry.date).toLocaleDateString('pt-AO')}</span>
												</td>
												<td className="px-6 py-4">
													<div className="text-sm font-semibold text-slate-900">{entry.description}</div>
													{entry.reversedById && (
														<div className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">Revertido</div>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center">
													<span className={cn(
														'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider',
														entry.source === 'AUTOMATIC' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'
													)}>
														{entry.source === 'AUTOMATIC' ? <Zap size={11} /> : <UserRound size={11} />}
														{entry.source === 'AUTOMATIC' ? 'Automático' : 'Manual'}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-right">
													<span className="text-sm font-bold tabular-nums text-slate-900">{fmt(total)}</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
													{!entry.reversedById && (
														<Button
															variant="ghost"
															size="sm"
															className="h-8 text-xs gap-1.5 text-slate-500 hover:text-rose-600 rounded-sm"
															onClick={() => handleReverse(entry.id)}
															disabled={reverseEntry.isPending}
														>
															<Undo2 size={13} />
															Reverter
														</Button>
													)}
												</td>
											</tr>
											{isExpanded && (
												<tr className="bg-slate-50/40">
													<td colSpan={7} className="px-6 py-3">
														<table className="w-full text-xs">
															<thead>
																<tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
																	<th className="text-left py-1.5 pl-8">Conta</th>
																	<th className="text-right py-1.5">Débito</th>
																	<th className="text-right py-1.5">Crédito</th>
																</tr>
															</thead>
															<tbody>
																{entry.lines.map((line) => (
																	<tr key={line.id} className="border-t border-slate-100">
																		<td className="py-2 pl-8 text-slate-700 font-medium">
																			<span className="font-mono text-slate-400 mr-2">{line.account?.code}</span>
																			{line.account?.name}
																		</td>
																		<td className="py-2 text-right tabular-nums text-slate-700">{line.debit > 0 ? fmt(line.debit) : ''}</td>
																		<td className="py-2 text-right tabular-nums text-slate-700">{line.credit > 0 ? fmt(line.credit) : ''}</td>
																	</tr>
																))}
															</tbody>
														</table>
													</td>
												</tr>
											)}
										</React.Fragment>
									);
								})
							) : (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-2">
											<div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center text-slate-300">
												<BookOpen size={22} />
											</div>
											<div className="text-slate-500 font-medium text-sm">Nenhum lançamento registado</div>
											<div className="text-slate-400 text-xs">Emita uma fatura ou crie um lançamento manual.</div>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{pagination && pagination.total > 0 && (
					<div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
						<div className="text-xs text-slate-500 font-medium">
							Mostrando <span className="text-slate-900 font-bold">{filtered.length}</span> de{' '}
							<span className="text-slate-900 font-bold">{pagination.total}</span> lançamentos
						</div>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={!pagination.hasPreviousPage} className="h-8 text-xs px-4 border-slate-200 rounded-sm">Anterior</Button>
							<Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage} className="h-8 text-xs px-4 border-slate-200 rounded-sm">Próximo</Button>
						</div>
					</div>
				)}
			</div>

			{/* ── Create Manual Entry Dialog ── */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-2xl rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Novo Lançamento Manual</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleCreate} className="space-y-4 mt-2">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Descrição *</label>
								<Input placeholder="Ex: Ajuste de saldo inicial" className="h-10 border-slate-200 rounded-sm text-sm" {...form.register('description')} />
								{form.formState.errors.description && <p className="text-[10px] text-rose-500">{form.formState.errors.description.message}</p>}
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Data</label>
								<Input type="date" max={today} className="h-10 border-slate-200 rounded-sm text-sm" {...form.register('date')} />
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<label className="text-xs font-semibold text-slate-700">Linhas do Lançamento *</label>
								<Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 border-slate-200 rounded-sm" onClick={() => append({ accountId: '', debit: 0, credit: 0 })}>
									<Plus size={12} /> Linha
								</Button>
							</div>
							<div className="border border-slate-200 rounded-sm divide-y divide-slate-100 max-h-72 overflow-y-auto">
								{fields.map((field, index) => {
									const line = watchedLines[index];
									const lineDebit = Number(line?.debit) || 0;
									const lineCredit = Number(line?.credit) || 0;
									const bothSides = lineDebit > 0 && lineCredit > 0;
									const noSide = lineDebit === 0 && lineCredit === 0;

									return (
										<div key={field.id} className="p-3 space-y-1.5">
											<div className="flex items-center gap-2">
												<div className="flex-1">
													<Select value={line?.accountId || ''} onValueChange={(v) => form.setValue(`lines.${index}.accountId`, v)}>
														<SelectTrigger className="h-9 border-slate-200 rounded-sm text-xs">
															<SelectValue placeholder="Conta..." />
														</SelectTrigger>
														<SelectContent>
															{movableAccounts.map((acc) => (
																<SelectItem key={acc.id} value={acc.id}>{acc.code} — {acc.name}</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<Input
													type="number"
													step="0.01"
													min="0"
													placeholder="Débito"
													className={cn('h-9 w-28 border-slate-200 rounded-sm text-xs', bothSides && 'border-rose-300')}
													onFocus={(e) => e.target.select()}
													{...form.register(`lines.${index}.debit`, {
														valueAsNumber: true,
														// Cada linha só leva um dos lados. Limpar o lado oposto
														// assim que o utilizador escreve evita o caso em que o
														// formulário dizia «Balanceado» e o servidor recusava
														// com «não pode ter débito e crédito em simultâneo».
														onChange: (e) => {
															if (Number(e.target.value) > 0) form.setValue(`lines.${index}.credit`, 0);
														},
													})}
												/>
												<Input
													type="number"
													step="0.01"
													min="0"
													placeholder="Crédito"
													className={cn('h-9 w-28 border-slate-200 rounded-sm text-xs', bothSides && 'border-rose-300')}
													onFocus={(e) => e.target.select()}
													{...form.register(`lines.${index}.credit`, {
														valueAsNumber: true,
														onChange: (e) => {
															if (Number(e.target.value) > 0) form.setValue(`lines.${index}.debit`, 0);
														},
													})}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-sm shrink-0"
													onClick={() => fields.length > 2 && remove(index)}
													disabled={fields.length <= 2}
												>
													<Trash2 size={13} />
												</Button>
											</div>
											{bothSides && (
												<p className="text-[10px] text-rose-500">
													Esta linha tem débito e crédito ao mesmo tempo. Ponha o valor num dos lados e registe a contrapartida noutra linha.
												</p>
											)}
											{!bothSides && noSide && !!line?.accountId && (
												<p className="text-[10px] text-amber-600">Indique o valor a débito ou a crédito.</p>
											)}
										</div>
									);
								})}
							</div>
							{form.formState.errors.lines && <p className="text-[10px] text-rose-500">{form.formState.errors.lines.message as string}</p>}
						</div>

						<div className={cn(
							'flex items-center justify-between p-3 rounded-sm border text-xs font-bold',
							canSubmit ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
						)}>
							<span>Débito: {fmt(totalDebit)} · Crédito: {fmt(totalCredit)}</span>
							<span>{canSubmit ? 'Balanceado ✓' : isBalanced ? 'Corrija as linhas' : 'Não balanceado'}</span>
						</div>

						<DialogFooter className="gap-2">
							<Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-200 rounded-sm h-10 text-sm">Cancelar</Button>
							<Button type="submit" disabled={createEntry.isPending || !canSubmit} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
								{createEntry.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Registar Lançamento'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
