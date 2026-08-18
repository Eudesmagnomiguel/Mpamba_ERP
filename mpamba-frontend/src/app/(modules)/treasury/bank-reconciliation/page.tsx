'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Landmark,
	Plus,
	Loader2,
	AlertCircle,
	Trash2,
	CheckCircle2,
	Circle,
	CircleDashed,
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
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateBankStatementSchema, CreateBankStatementDto } from '@/shared/dto/treasury.dto';
import { useAccounts, useBankStatements, useCreateBankStatement } from '@/hooks/module/treasury';

const fmt = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
	PENDING: { label: 'Pendente', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: CircleDashed },
	PARTIAL: { label: 'Parcial', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Circle },
	COMPLETED: { label: 'Concluído', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
};

export default function BankReconciliationPage() {
	const router = useRouter();
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const { data: statements, isLoading, error } = useBankStatements();
	const { data: accountsData } = useAccounts({ pageSize: 100 });
	const createStatement = useCreateBankStatement();
	const accounts = accountsData?.data || [];

	const form = useForm<CreateBankStatementDto>({
		resolver: zodResolver(CreateBankStatementSchema),
		defaultValues: {
			fileName: '',
			startingBalance: 0,
			endingBalance: 0,
			lines: [{ date: '', description: '', amount: 0, type: 'ENTRADA' }],
		},
	});
	const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });

	const handleCreate = form.handleSubmit(async (data) => {
		try {
			const created = await createStatement.mutateAsync(data);
			toast.success('Extrato bancário criado com sucesso!');
			setIsCreateOpen(false);
			form.reset({ fileName: '', startingBalance: 0, endingBalance: 0, lines: [{ date: '', description: '', amount: 0, type: 'ENTRADA' }] });
			router.push(`/treasury/bank-reconciliation/${created.id}`);
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao criar o extrato.');
		}
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reconciliação Bancária</h1>
					<p className="text-slate-500 text-sm mt-1">Compare os extratos do banco com os movimentos registados.</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
					<Plus size={16} />
					Novo Extrato
				</Button>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center h-48">
					<Loader2 size={28} className="text-primary animate-spin" />
				</div>
			) : error ? (
				<div className="p-6 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 flex items-center gap-3">
					<AlertCircle size={20} />
					<p className="text-sm font-medium">Erro ao carregar os extratos.</p>
				</div>
			) : (statements?.length ?? 0) > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{statements!.map((st) => {
						const meta = STATUS_META[st.status] ?? STATUS_META.PENDING!;
						const StatusIcon = meta.icon;
						const reconciledCount = st.lines.filter((l) => l.isReconciled).length;
						return (
							<Card
								key={st.id}
								className="border-slate-200 shadow-sm rounded-sm bg-white cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
								onClick={() => router.push(`/treasury/bank-reconciliation/${st.id}`)}
							>
								<CardContent className="p-5 space-y-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center shrink-0">
												<Landmark size={18} />
											</div>
											<div>
												<p className="text-sm font-bold text-slate-900">{st.fileName}</p>
												<p className="text-[10px] text-slate-400 font-medium">{st.account?.name ?? '—'}</p>
											</div>
										</div>
										<span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider shrink-0', meta.color)}>
											<StatusIcon size={10} />
											{meta.label}
										</span>
									</div>
									<div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
										<span>{new Date(st.startDate).toLocaleDateString('pt-AO')} – {new Date(st.endDate).toLocaleDateString('pt-AO')}</span>
										<span className="font-bold text-slate-700">{reconciledCount}/{st.lines.length} linhas</span>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			) : (
				<div className="bg-white border border-slate-200 rounded-sm py-20 flex flex-col items-center gap-3 text-slate-400">
					<Landmark size={36} className="opacity-30" />
					<p className="text-sm font-medium text-slate-500">Nenhum extrato bancário registado</p>
					<Button onClick={() => setIsCreateOpen(true)} size="sm" className="bg-primary hover:bg-primary text-white rounded-sm h-9 px-4 text-xs gap-1.5 mt-1">
						<Plus size={13} /> Novo Extrato
					</Button>
				</div>
			)}

			{/* ── Create Dialog ── */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-2xl rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Novo Extrato Bancário</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleCreate} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Conta *</label>
								<Select onValueChange={(v) => form.setValue('accountId', v)}>
									<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
										<SelectValue placeholder="Selecionar conta" />
									</SelectTrigger>
									<SelectContent>
										{accounts.map((acc) => (
											<SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Nome do Extrato *</label>
								<Input placeholder="Ex: BFA Julho 2026" className="h-10 border-slate-200 rounded-sm text-sm" {...form.register('fileName')} />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Data Início *</label>
								<Input type="date" className="h-10 border-slate-200 rounded-sm text-sm" {...form.register('startDate')} />
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Data Fim *</label>
								<Input type="date" className="h-10 border-slate-200 rounded-sm text-sm" {...form.register('endDate')} />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Saldo Inicial *</label>
								<Input type="number" step="0.01" className="h-10 border-slate-200 rounded-sm text-sm" {...form.register('startingBalance', { valueAsNumber: true })} />
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Saldo Final *</label>
								<Input type="number" step="0.01" className="h-10 border-slate-200 rounded-sm text-sm" {...form.register('endingBalance', { valueAsNumber: true })} />
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<label className="text-xs font-semibold text-slate-700">Linhas do Extrato *</label>
								<Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 border-slate-200 rounded-sm" onClick={() => append({ date: '', description: '', amount: 0, type: 'ENTRADA' })}>
									<Plus size={12} /> Linha
								</Button>
							</div>
							<div className="border border-slate-200 rounded-sm divide-y divide-slate-100 max-h-64 overflow-y-auto">
								{fields.map((field, index) => (
									<div key={field.id} className="p-2.5 grid grid-cols-12 gap-1.5 items-center">
										<Input type="date" className="col-span-3 h-9 border-slate-200 rounded-sm text-xs" {...form.register(`lines.${index}.date`)} />
										<Input placeholder="Descrição" className="col-span-4 h-9 border-slate-200 rounded-sm text-xs" {...form.register(`lines.${index}.description`)} />
										<Input type="number" step="0.01" placeholder="Valor" className="col-span-2 h-9 border-slate-200 rounded-sm text-xs" {...form.register(`lines.${index}.amount`, { valueAsNumber: true })} />
										<Select defaultValue="ENTRADA" onValueChange={(v) => form.setValue(`lines.${index}.type`, v as any)}>
											<SelectTrigger className="col-span-2 h-9 border-slate-200 rounded-sm text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ENTRADA">Entrada</SelectItem>
												<SelectItem value="SAIDA">Saída</SelectItem>
												<SelectItem value="TRANSFERENCIA">Transf.</SelectItem>
											</SelectContent>
										</Select>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="col-span-1 h-8 w-8 text-slate-400 hover:text-rose-600 rounded-sm"
											onClick={() => fields.length > 1 && remove(index)}
											disabled={fields.length <= 1}
										>
											<Trash2 size={13} />
										</Button>
									</div>
								))}
							</div>
						</div>

						<DialogFooter className="gap-2">
							<Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-200 rounded-sm h-10 text-sm">Cancelar</Button>
							<Button type="submit" disabled={createStatement.isPending} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
								{createStatement.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Criar Extrato'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
