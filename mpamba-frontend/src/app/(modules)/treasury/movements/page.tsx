'use client';

import React, { useState } from 'react';
import {
	Search,
	Filter,
	ArrowUpCircle,
	ArrowDownCircle,
	ArrowLeftRight,
	Calendar,
	User,
	Building2,
	Loader2,
	AlertCircle,
	Plus,
	MoreVertical,
	FileText,
	Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import {
	useMovements,
	useCreateMovement,
	useCreateTransfer,
	useDeleteMovement,
	useAccounts,
	useCategories,
} from '@/hooks/module/treasury';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateMovementSchema, CreateMovementDto, CreateTransferSchema, CreateTransferDto } from '@/shared/dto/treasury.dto';
import { toast } from 'sonner';
import { FinancialMovementType } from '@/shared/types/treasury.types';

type MovementTab = 'ALL' | 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';

const movementConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
	ENTRADA: { label: 'Entrada', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ArrowUpCircle },
	SAIDA: { label: 'Saída', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: ArrowDownCircle },
	TRANSFERENCIA: { label: 'Transferência', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: ArrowLeftRight },
};

export default function MovementsPage() {
	const [activeTab, setActiveTab] = useState<MovementTab>('ALL');
	const [searchTerm, setSearchTerm] = useState('');
	const [isMovementOpen, setIsMovementOpen] = useState(false);
	const [isTransferOpen, setIsTransferOpen] = useState(false);
	const [page, setPage] = useState(1);

	const filters = {
		type: activeTab !== 'ALL' ? (activeTab as FinancialMovementType) : undefined,
		page,
		pageSize: 20,
	};

	const { data: movementsData, isLoading, error } = useMovements(filters);
	const { data: accountsData } = useAccounts({ pageSize: 100 });
	const { data: categoriesData } = useCategories({ pageSize: 100 });
	const createMovement = useCreateMovement();
	const createTransfer = useCreateTransfer();
	const deleteMovement = useDeleteMovement();

	const movements = movementsData?.data || [];
	const pagination = movementsData?.pagination;
	const accounts = accountsData?.data || [];
	const categories = categoriesData?.data || [];

	const movementForm = useForm<CreateMovementDto>({
		resolver: zodResolver(CreateMovementSchema),
		defaultValues: { type: 'ENTRADA', accountId: '', amount: 0, description: '', reference: '', date: '', categoryId: null },
	});

	const transferForm = useForm<CreateTransferDto>({
		resolver: zodResolver(CreateTransferSchema),
		defaultValues: { originAccountId: '', destinationAccountId: '', amount: 0, description: '', date: '' },
	});

	/** Remove campos vazios para não enviar '' onde o backend espera uma data/id. */
	const clean = <T extends Record<string, unknown>>(data: T) =>
		Object.fromEntries(
			Object.entries(data).filter(([, value]) => value !== '' && value !== undefined)
		) as T;

	const errorMessage = (err: unknown, fallback: string) =>
		(err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

	const handleMovementSubmit = movementForm.handleSubmit(async (data) => {
		try {
			await createMovement.mutateAsync(clean(data));
			toast.success('Movimento registado com sucesso!');
			setIsMovementOpen(false);
			movementForm.reset();
		} catch (err) {
			toast.error(errorMessage(err, 'Erro ao registar o movimento.'));
		}
	});

	const handleTransferSubmit = transferForm.handleSubmit(async (data) => {
		try {
			await createTransfer.mutateAsync(clean(data));
			toast.success('Transferência realizada com sucesso!');
			setIsTransferOpen(false);
			transferForm.reset();
		} catch (err) {
			toast.error(errorMessage(err, 'Erro ao realizar a transferência.'));
		}
	});

	const handleDelete = async (id: string) => {
		try {
			await deleteMovement.mutateAsync(id);
			toast.success('Movimento eliminado.');
		} catch (err) {
			toast.error(errorMessage(err, 'Erro ao eliminar o movimento.'));
		}
	};

	const tabs: { key: MovementTab; label: string }[] = [
		{ key: 'ALL', label: 'Todos' },
		{ key: 'ENTRADA', label: 'Receitas' },
		{ key: 'SAIDA', label: 'Despesas' },
		{ key: 'TRANSFERENCIA', label: 'Transferências' },
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Movimentos Financeiros</h1>
					<p className="text-slate-500 text-sm mt-1">Registo completo de receitas, despesas e transferências.</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setIsTransferOpen(true)} className="border-slate-200 text-slate-600 gap-2 h-11 rounded-sm hover:bg-slate-50">
						<ArrowLeftRight size={16} />
						Transferência
					</Button>
					<Button onClick={() => setIsMovementOpen(true)} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
						<Plus size={16} />
						Novo Movimento
					</Button>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 bg-slate-100/70 p-1 rounded-sm w-fit">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => { setActiveTab(tab.key); setPage(1); }}
						className={cn(
							'px-4 py-1.5 text-xs font-semibold rounded-sm transition-all',
							activeTab === tab.key
								? 'bg-white text-slate-900 shadow-sm'
								: 'text-slate-500 hover:text-slate-700'
						)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Filters */}
			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3 flex gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
						<Input
							placeholder="Pesquisar por descrição, referência ou conta..."
							className="pl-9 h-10 bg-white border-slate-200 rounded-sm text-sm"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<Button variant="outline" className="h-10 border-slate-200 text-slate-600 gap-2 hover:bg-slate-50 rounded-sm">
						<Filter size={15} />
						Filtros
					</Button>
					<Button variant="outline" className="h-10 border-slate-200 text-slate-600 gap-2 hover:bg-slate-50 rounded-sm">
						<Calendar size={15} />
						Exportar
					</Button>
				</CardContent>
			</Card>

			{/* Table */}
			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50/70 border-b border-slate-200">
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conta</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Tipo</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
								<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading ? (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3">
											<Loader2 size={28} className="text-primary animate-spin" />
											<p className="text-sm font-medium text-slate-500">A carregar movimentos...</p>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center text-rose-500">
										<AlertCircle size={28} className="mx-auto" />
										<p className="text-sm font-medium mt-2">Erro ao carregar os movimentos.</p>
									</td>
								</tr>
							) : movements.length > 0 ? (
								movements.map((mv) => {
									const cfg = movementConfig[mv.type] ?? movementConfig.SAIDA;
									const Icon = cfg.icon;
									return (
										<tr key={mv.id} className="hover:bg-slate-50/50 transition-colors group">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-slate-900">
													{new Date(mv.date).toLocaleDateString('pt-AO')}
												</div>
												<div className="text-[10px] text-slate-400 font-bold uppercase">
													{new Date(mv.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm font-semibold text-slate-900">{mv.description}</div>
												{mv.reference && (
													<div className="text-[10px] font-mono text-slate-400">{mv.reference}</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<Building2 size={13} className="text-slate-400" />
													<span className="text-xs text-slate-600 font-medium">{mv.account?.name ?? '—'}</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className="text-xs text-slate-500">{mv.category?.name ?? '—'}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center">
												<div className={cn(
													'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider',
													cfg.color
												)}>
													<Icon size={11} />
													{cfg.label}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right">
												<span className={cn(
													'text-sm font-bold tabular-nums',
													mv.type === 'ENTRADA' ? 'text-emerald-600' :
														mv.type === 'SAIDA' ? 'text-rose-600' : 'text-blue-600'
												)}>
													{mv.type === 'ENTRADA' ? '+' : mv.type === 'SAIDA' ? '-' : ''}
													{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(mv.amount)}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-sm">
															<MoreVertical size={15} />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-44 p-1 rounded-sm shadow-lg border-slate-200">
														<DropdownMenuItem className="gap-2 cursor-pointer rounded-sm text-xs">
															<FileText size={13} />
															Ver Detalhes
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="gap-2 cursor-pointer rounded-sm text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50"
															onClick={() => handleDelete(mv.id)}
														>
															<Trash2 size={13} />
															Eliminar
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-2">
											<div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center text-slate-300">
												<ArrowLeftRight size={22} />
											</div>
											<div className="text-slate-500 font-medium text-sm">Nenhum movimento registado</div>
											<div className="text-slate-400 text-xs">Crie o primeiro movimento financeiro.</div>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{pagination && pagination.total > 0 && (
					<div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
						<div className="text-xs text-slate-500 font-medium">
							Mostrando <span className="text-slate-900 font-bold">{movements.length}</span> de{' '}
							<span className="text-slate-900 font-bold">{pagination.total}</span> movimentos
						</div>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPreviousPage} className="h-8 text-xs px-4 border-slate-200 rounded-sm">Anterior</Button>
							<Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="h-8 text-xs px-4 border-slate-200 rounded-sm">Próximo</Button>
						</div>
					</div>
				)}
			</div>

			{/* ── New Movement Dialog ── */}
			<Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
				<DialogContent className="sm:max-w-md rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Novo Movimento</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleMovementSubmit} className="space-y-4 mt-2">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Tipo</label>
								<Select value={movementForm.watch('type')} onValueChange={(v) => movementForm.setValue('type', v as 'ENTRADA' | 'SAIDA')}>
									<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ENTRADA">Receita (Entrada)</SelectItem>
										<SelectItem value="SAIDA">Despesa (Saída)</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Conta *</label>
								<Select onValueChange={(v) => movementForm.setValue('accountId', v)}>
									<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
										<SelectValue placeholder="Selecionar conta" />
									</SelectTrigger>
									<SelectContent>
										{accounts.map((acc) => (
											<SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
								{movementForm.formState.errors.accountId && (
									<p className="text-[10px] text-rose-500">{movementForm.formState.errors.accountId.message}</p>
								)}
							</div>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Descrição *</label>
							<Input
								placeholder="Ex: Pagamento de fornecedor"
								className="h-10 border-slate-200 rounded-sm text-sm"
								{...movementForm.register('description')}
							/>
							{movementForm.formState.errors.description && (
								<p className="text-[10px] text-rose-500">{movementForm.formState.errors.description.message}</p>
							)}
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Valor (AOA) *</label>
								<Input
									type="number"
									min={0}
									step="0.01"
									placeholder="0.00"
									className="h-10 border-slate-200 rounded-sm text-sm"
									{...movementForm.register('amount', { valueAsNumber: true })}
								/>
								{movementForm.formState.errors.amount && (
									<p className="text-[10px] text-rose-500">{movementForm.formState.errors.amount.message}</p>
								)}
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Categoria</label>
								<Select onValueChange={(v) => movementForm.setValue('categoryId', v === 'none' ? null : v)}>
									<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
										<SelectValue placeholder="Opcional" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Sem categoria</SelectItem>
										{categories.map((cat) => (
											<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Referência</label>
							<Input
								placeholder="Ex: FAT-2024-001 (opcional)"
								className="h-10 border-slate-200 rounded-sm text-sm"
								{...movementForm.register('reference')}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Data</label>
							<Input
								type="date"
								className="h-10 border-slate-200 rounded-sm text-sm"
								{...movementForm.register('date')}
							/>
						</div>
						<DialogFooter className="mt-6 gap-2">
							<Button type="button" variant="outline" onClick={() => setIsMovementOpen(false)} className="border-slate-200 rounded-sm h-10 text-sm">
								Cancelar
							</Button>
							<Button type="submit" disabled={createMovement.isPending} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
								{createMovement.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Registar'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* ── Transfer Dialog ── */}
			<Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
				<DialogContent className="sm:max-w-md rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Nova Transferência</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleTransferSubmit} className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Conta de Origem *</label>
							<Select onValueChange={(v) => transferForm.setValue('originAccountId', v)}>
								<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
									<SelectValue placeholder="Selecionar conta" />
								</SelectTrigger>
								<SelectContent>
									{accounts.map((acc) => (
										<SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
							{transferForm.formState.errors.originAccountId && (
								<p className="text-[10px] text-rose-500">{transferForm.formState.errors.originAccountId.message}</p>
							)}
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Conta de Destino *</label>
							<Select onValueChange={(v) => transferForm.setValue('destinationAccountId', v)}>
								<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
									<SelectValue placeholder="Selecionar conta" />
								</SelectTrigger>
								<SelectContent>
									{accounts.map((acc) => (
										<SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
							{transferForm.formState.errors.destinationAccountId && (
								<p className="text-[10px] text-rose-500">{transferForm.formState.errors.destinationAccountId.message}</p>
							)}
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Valor (AOA) *</label>
							<Input
								type="number"
								min={0}
								step="0.01"
								placeholder="0.00"
								className="h-10 border-slate-200 rounded-sm text-sm"
								{...transferForm.register('amount', { valueAsNumber: true })}
							/>
							{transferForm.formState.errors.amount && (
								<p className="text-[10px] text-rose-500">{transferForm.formState.errors.amount.message}</p>
							)}
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Descrição</label>
							<Input
								placeholder="Ex: Reforço de caixa"
								className="h-10 border-slate-200 rounded-sm text-sm"
								{...transferForm.register('description')}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Data</label>
							<Input
								type="date"
								className="h-10 border-slate-200 rounded-sm text-sm"
								{...transferForm.register('date')}
							/>
						</div>
						<DialogFooter className="mt-6 gap-2">
							<Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)} className="border-slate-200 rounded-sm h-10 text-sm">
								Cancelar
							</Button>
							<Button type="submit" disabled={createTransfer.isPending} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
								{createTransfer.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Transferir'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
