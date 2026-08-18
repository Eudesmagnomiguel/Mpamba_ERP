'use client';

import React, { useState } from 'react';
import {
	Building2,
	Wallet,
	Plus,
	Search,
	MoreVertical,
	Loader2,
	AlertCircle,
	Pencil,
	Trash2,
	CheckCircle,
	XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';
import {
	useAccounts,
	useCreateAccount,
	useUpdateAccount,
	useDeleteAccount,
} from '@/hooks/module/treasury';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateFinancialAccountSchema, CreateFinancialAccountDto, UpdateFinancialAccountDto, UpdateFinancialAccountSchema } from '@/shared/dto/treasury.dto';
import { FinancialAccount } from '@/shared/types/treasury.types';
import { toast } from 'sonner';

export default function AccountsPage() {
	const [search, setSearch] = useState('');
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<FinancialAccount | null>(null);
	const [page, setPage] = useState(1);

	const { data: accountsData, isLoading, error } = useAccounts({ page, pageSize: 20, search: search || undefined });
	const createAccount = useCreateAccount();
	const updateAccount = useUpdateAccount();
	const deleteAccount = useDeleteAccount();

	const accounts = accountsData?.data || [];
	const pagination = accountsData?.pagination;

	const createForm = useForm<CreateFinancialAccountDto>({
		resolver: zodResolver(CreateFinancialAccountSchema),
		defaultValues: { type: 'CAIXA', currency: 'AOA', currentBalance: 0, allowNegative: false },
	});

	const editForm = useForm<UpdateFinancialAccountDto>({
		resolver: zodResolver(UpdateFinancialAccountSchema),
	});

	const handleCreate = createForm.handleSubmit(async (data) => {
		try {
			await createAccount.mutateAsync(data);
			toast.success('Conta criada com sucesso!');
			setIsCreateOpen(false);
			createForm.reset();
		} catch {
			toast.error('Erro ao criar a conta.');
		}
	});

	const handleEdit = editForm.handleSubmit(async (data) => {
		if (!editTarget) return;
		try {
			await updateAccount.mutateAsync({ id: editTarget.id, data });
			toast.success('Conta actualizada!');
			setEditTarget(null);
			editForm.reset();
		} catch {
			toast.error('Erro ao actualizar a conta.');
		}
	});

	const handleDelete = async (id: string) => {
		try {
			await deleteAccount.mutateAsync(id);
			toast.success('Conta eliminada.');
		} catch {
			toast.error('Erro ao eliminar a conta.');
		}
	};

	const openEdit = (acc: FinancialAccount) => {
		setEditTarget(acc);
		editForm.reset({ name: acc.name, type: acc.type, currency: acc.currency, allowNegative: acc.allowNegative, isActive: acc.isActive });
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contas Financeiras</h1>
					<p className="text-slate-500 text-sm mt-1">Gerir contas bancárias e caixas da organização.</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
					<Plus size={16} />
					Nova Conta
				</Button>
			</div>

			{/* Search */}
			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3 flex gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
						<Input
							placeholder="Pesquisar conta..."
							className="pl-9 h-10 bg-white border-slate-200 rounded-sm text-sm"
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Accounts Grid */}
			{isLoading ? (
				<div className="flex items-center justify-center h-48">
					<Loader2 size={28} className="text-primary animate-spin" />
				</div>
			) : error ? (
				<div className="p-6 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 flex items-center gap-3">
					<AlertCircle size={20} />
					<p className="text-sm font-medium">Erro ao carregar as contas.</p>
				</div>
			) : accounts.length > 0 ? (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{accounts.map((acc) => {
							const isBank = acc.type === 'BANCO';
							return (
								<Card key={acc.id} className={cn(
									'border shadow-sm rounded-sm overflow-hidden transition-all hover:shadow-md',
									acc.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'
								)}>
									<CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
										<div className="flex items-center gap-3">
											<div className={cn(
												'w-10 h-10 rounded-sm flex items-center justify-center',
												isBank ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
											)}>
												{isBank ? <Building2 size={18} /> : <Wallet size={18} />}
											</div>
											<div>
												<CardTitle className="text-sm font-bold text-slate-900">{acc.name}</CardTitle>
												<div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
													{isBank ? 'Conta Bancária' : 'Caixa'} · {acc.currency}
												</div>
											</div>
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-sm">
													<MoreVertical size={15} />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-44 p-1 rounded-sm shadow-lg border-slate-200">
												<DropdownMenuItem className="gap-2 cursor-pointer rounded-sm text-xs" onClick={() => openEdit(acc)}>
													<Pencil size={13} />
													Editar
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="gap-2 cursor-pointer rounded-sm text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50"
													onClick={() => handleDelete(acc.id)}
												>
													<Trash2 size={13} />
													Eliminar
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</CardHeader>
									<CardContent className="px-5 pb-5">
										<div className="mt-1">
											<div className={cn(
												'text-2xl font-bold tabular-nums',
												acc.currentBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
											)}>
												{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(acc.currentBalance)}
											</div>
											<div className="text-xs text-slate-400 mt-0.5">Saldo actual</div>
										</div>
										<div className="mt-4 flex items-center gap-2">
											{acc.isActive ? (
												<span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">
													<CheckCircle size={10} /> Activa
												</span>
											) : (
												<span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-100">
													<XCircle size={10} /> Inactiva
												</span>
											)}
											{acc.allowNegative && (
												<span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-100">
													Permite negativo
												</span>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
					{pagination && pagination.total > accounts.length && (
						<div className="flex items-center justify-between pt-2">
							<p className="text-xs text-slate-500">
								Mostrando <span className="font-bold text-slate-900">{accounts.length}</span> de{' '}
								<span className="font-bold text-slate-900">{pagination.total}</span> contas
							</p>
							<div className="flex gap-2">
								<Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPreviousPage} className="h-8 text-xs px-4 border-slate-200 rounded-sm">Anterior</Button>
								<Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="h-8 text-xs px-4 border-slate-200 rounded-sm">Próximo</Button>
							</div>
						</div>
					)}
				</>
			) : (
				<div className="bg-white border border-slate-200 rounded-sm py-20 flex flex-col items-center gap-3 text-slate-400">
					<Building2 size={36} className="opacity-30" />
					<p className="text-sm font-medium text-slate-500">Nenhuma conta registada</p>
					<Button onClick={() => setIsCreateOpen(true)} size="sm" className="bg-primary hover:bg-primary text-white rounded-sm h-9 px-4 text-xs gap-1.5 mt-1">
						<Plus size={13} /> Criar Conta
					</Button>
				</div>
			)}

			{/* ── Create Dialog ── */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-md rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Nova Conta Financeira</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleCreate} className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Nome da Conta *</label>
							<Input placeholder="Ex: Conta BFA, Caixa Principal" className="h-10 border-slate-200 rounded-sm text-sm" {...createForm.register('name')} />
							{createForm.formState.errors.name && <p className="text-[10px] text-rose-500">{createForm.formState.errors.name.message}</p>}
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Tipo *</label>
								<Select defaultValue="CAIXA" onValueChange={(v) => createForm.setValue('type', v as 'CAIXA' | 'BANCO')}>
									<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="CAIXA">Caixa</SelectItem>
										<SelectItem value="BANCO">Banco</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Saldo Inicial</label>
								<Input type="number" min={0} step="0.01" placeholder="0.00" className="h-10 border-slate-200 rounded-sm text-sm" {...createForm.register('currentBalance', { valueAsNumber: true })} />
							</div>
						</div>
						<div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-sm border border-slate-100">
							<div>
								<label className="text-xs font-semibold text-slate-700">Permite saldo negativo</label>
								<p className="text-[10px] text-slate-400">Permitir movimentos mesmo sem saldo suficiente.</p>
							</div>
							<input
								type="checkbox"
								className="w-4 h-4 accent-primary cursor-pointer"
								checked={createForm.watch('allowNegative') ?? false}
								onChange={(e) => createForm.setValue('allowNegative', e.target.checked)}
							/>
						</div>
						<DialogFooter className="gap-2">
							<Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-200 rounded-sm h-10 text-sm">Cancelar</Button>
							<Button type="submit" disabled={createAccount.isPending} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
								{createAccount.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Criar Conta'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* ── Edit Dialog ── */}
			<Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
				<DialogContent className="sm:max-w-md rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Editar Conta</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleEdit} className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Nome da Conta</label>
							<Input className="h-10 border-slate-200 rounded-sm text-sm" {...editForm.register('name')} />
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Tipo</label>
							<Select value={editForm.watch('type')} onValueChange={(v) => editForm.setValue('type', v as 'CAIXA' | 'BANCO')}>
								<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="CAIXA">Caixa</SelectItem>
									<SelectItem value="BANCO">Banco</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-sm border border-slate-100">
							<div>
								<label className="text-xs font-semibold text-slate-700">Activa</label>
								<p className="text-[10px] text-slate-400">Desactivar impede novos movimentos nesta conta.</p>
							</div>
							<input
								type="checkbox"
								className="w-4 h-4 accent-primary cursor-pointer"
								checked={editForm.watch('isActive') ?? true}
								onChange={(e) => editForm.setValue('isActive', e.target.checked)}
							/>
						</div>
						<div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-sm border border-slate-100">
							<div>
								<label className="text-xs font-semibold text-slate-700">Permite saldo negativo</label>
							</div>
							<input
								type="checkbox"
								className="w-4 h-4 accent-primary cursor-pointer"
								checked={editForm.watch('allowNegative') ?? false}
								onChange={(e) => editForm.setValue('allowNegative', e.target.checked)}
							/>
						</div>
						<DialogFooter className="gap-2">
							<Button type="button" variant="outline" onClick={() => setEditTarget(null)} className="border-slate-200 rounded-sm h-10 text-sm">Cancelar</Button>
							<Button type="submit" disabled={updateAccount.isPending} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
								{updateAccount.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Guardar'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
