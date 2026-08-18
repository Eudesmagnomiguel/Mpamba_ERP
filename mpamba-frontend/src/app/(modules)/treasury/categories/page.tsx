'use client';

import React, { useState } from 'react';
import {
	Tag,
	Plus,
	Search,
	MoreVertical,
	Loader2,
	AlertCircle,
	Pencil,
	Trash2,
	ArrowUpCircle,
	ArrowDownCircle,
	ArrowLeftRight,
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
	useCategories,
	useCreateCategory,
	useUpdateCategory,
	useDeleteCategory,
} from '@/hooks/module/treasury';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateFinancialCategorySchema, CreateFinancialCategoryDto, UpdateFinancialCategoryDto, UpdateFinancialCategorySchema } from '@/shared/dto/treasury.dto';
import { FinancialCategory, FinancialMovementType } from '@/shared/types/treasury.types';
import { toast } from 'sonner';

type FilterType = 'ALL' | FinancialMovementType;

const typeConfig: Record<FinancialMovementType, { label: string; color: string; icon: React.ElementType }> = {
	ENTRADA: { label: 'Receita', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ArrowUpCircle },
	SAIDA: { label: 'Despesa', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: ArrowDownCircle },
	TRANSFERENCIA: { label: 'Transferência', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: ArrowLeftRight },
};

export default function CategoriesPage() {
	const [search, setSearch] = useState('');
	const [filterType, setFilterType] = useState<FilterType>('ALL');
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<FinancialCategory | null>(null);
	const [page, setPage] = useState(1);

	const { data: categoriesData, isLoading, error } = useCategories({
		page,
		pageSize: 30,
		search: search || undefined,
		type: filterType !== 'ALL' ? (filterType as FinancialMovementType) : undefined,
	});
	const createCategory = useCreateCategory();
	const updateCategory = useUpdateCategory();
	const deleteCategory = useDeleteCategory();

	const categories = categoriesData?.data || [];
	const pagination = categoriesData?.pagination;

	const createForm = useForm<CreateFinancialCategoryDto>({
		resolver: zodResolver(CreateFinancialCategorySchema),
		defaultValues: { type: 'SAIDA' },
	});

	const editForm = useForm<UpdateFinancialCategoryDto>({
		resolver: zodResolver(UpdateFinancialCategorySchema),
	});

	const handleCreate = createForm.handleSubmit(async (data) => {
		try {
			await createCategory.mutateAsync(data);
			toast.success('Categoria criada com sucesso!');
			setIsCreateOpen(false);
			createForm.reset();
		} catch {
			toast.error('Erro ao criar a categoria.');
		}
	});

	const handleEdit = editForm.handleSubmit(async (data) => {
		if (!editTarget) return;
		try {
			await updateCategory.mutateAsync({ id: editTarget.id, data });
			toast.success('Categoria actualizada!');
			setEditTarget(null);
		} catch {
			toast.error('Erro ao actualizar a categoria.');
		}
	});

	const handleDelete = async (id: string) => {
		try {
			await deleteCategory.mutateAsync(id);
			toast.success('Categoria eliminada.');
		} catch {
			toast.error('Erro ao eliminar a categoria.');
		}
	};

	const openEdit = (cat: FinancialCategory) => {
		setEditTarget(cat);
		editForm.reset({ name: cat.name, type: cat.type });
	};

	const tabs: { key: FilterType; label: string }[] = [
		{ key: 'ALL', label: 'Todas' },
		{ key: 'ENTRADA', label: 'Receitas' },
		{ key: 'SAIDA', label: 'Despesas' },
		{ key: 'TRANSFERENCIA', label: 'Transferências' },
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categorias Financeiras</h1>
					<p className="text-slate-500 text-sm mt-1">Organize os movimentos por tipo e categoria.</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
					<Plus size={16} />
					Nova Categoria
				</Button>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 bg-slate-100/70 p-1 rounded-sm w-fit">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => { setFilterType(tab.key); setPage(1); }}
						className={cn(
							'px-4 py-1.5 text-xs font-semibold rounded-sm transition-all',
							filterType === tab.key
								? 'bg-white text-slate-900 shadow-sm'
								: 'text-slate-500 hover:text-slate-700'
						)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Search */}
			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
						<Input
							placeholder="Pesquisar categoria..."
							className="pl-9 h-10 bg-white border-slate-200 rounded-sm text-sm"
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Table */}
			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-slate-50/70 border-b border-slate-200">
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Criada em</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{isLoading ? (
							<tr>
								<td colSpan={5} className="px-6 py-20 text-center">
									<Loader2 size={28} className="mx-auto text-primary animate-spin" />
									<p className="text-sm font-medium text-slate-500 mt-3">A carregar categorias...</p>
								</td>
							</tr>
						) : error ? (
							<tr>
								<td colSpan={5} className="px-6 py-20 text-center text-rose-500">
									<AlertCircle size={28} className="mx-auto" />
									<p className="text-sm font-medium mt-2">Erro ao carregar as categorias.</p>
								</td>
							</tr>
						) : categories.length > 0 ? (
							categories.map((cat) => {
								const cfg = typeConfig[cat.type];
								const Icon = cfg.icon;
								return (
									<tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500">
													<Tag size={15} />
												</div>
												<span className="text-sm font-semibold text-slate-900">{cat.name}</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className={cn(
												'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider',
												cfg.color
											)}>
												<Icon size={11} />
												{cfg.label}
											</div>
										</td>
										<td className="px-6 py-4">
											{cat.isActive ? (
												<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">Activa</span>
											) : (
												<span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-100">Inactiva</span>
											)}
										</td>
										<td className="px-6 py-4 text-xs text-slate-500">
											{new Date(cat.createdAt).toLocaleDateString('pt-AO')}
										</td>
										<td className="px-6 py-4 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-sm">
														<MoreVertical size={15} />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-44 p-1 rounded-sm shadow-lg border-slate-200">
													<DropdownMenuItem className="gap-2 cursor-pointer rounded-sm text-xs" onClick={() => openEdit(cat)}>
														<Pencil size={13} />
														Editar
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="gap-2 cursor-pointer rounded-sm text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50"
														onClick={() => handleDelete(cat.id)}
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
								<td colSpan={5} className="px-6 py-20 text-center">
									<div className="flex flex-col items-center gap-2">
										<div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center text-slate-300">
											<Tag size={22} />
										</div>
										<div className="text-slate-500 font-medium text-sm">Nenhuma categoria encontrada</div>
										<div className="text-slate-400 text-xs">Crie a primeira categoria financeira.</div>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>

				{/* Pagination */}
				{pagination && pagination.total > 0 && (
					<div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
						<div className="text-xs text-slate-500 font-medium">
							Mostrando <span className="text-slate-900 font-bold">{categories.length}</span> de{' '}
							<span className="text-slate-900 font-bold">{pagination.total}</span> categorias
						</div>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPreviousPage} className="h-8 text-xs px-4 border-slate-200 rounded-sm">Anterior</Button>
							<Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="h-8 text-xs px-4 border-slate-200 rounded-sm">Próximo</Button>
						</div>
					</div>
				)}
			</div>

			{/* ── Create Dialog ── */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-sm rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Nova Categoria</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleCreate} className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Nome *</label>
							<Input placeholder="Ex: Fornecedores, Salários..." className="h-10 border-slate-200 rounded-sm text-sm" {...createForm.register('name')} />
							{createForm.formState.errors.name && <p className="text-[10px] text-rose-500">{createForm.formState.errors.name.message}</p>}
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Tipo *</label>
							<Select defaultValue="SAIDA" onValueChange={(v) => createForm.setValue('type', v as FinancialMovementType)}>
								<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="ENTRADA">Receita (Entrada)</SelectItem>
									<SelectItem value="SAIDA">Despesa (Saída)</SelectItem>
									<SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DialogFooter className="gap-2">
							<Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-200 rounded-sm h-10 text-sm">Cancelar</Button>
							<Button type="submit" disabled={createCategory.isPending} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
								{createCategory.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Criar'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* ── Edit Dialog ── */}
			<Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
				<DialogContent className="sm:max-w-sm rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Editar Categoria</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleEdit} className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Nome</label>
							<Input className="h-10 border-slate-200 rounded-sm text-sm" {...editForm.register('name')} />
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Tipo</label>
							<Select value={editForm.watch('type')} onValueChange={(v) => editForm.setValue('type', v as FinancialMovementType)}>
								<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="ENTRADA">Receita (Entrada)</SelectItem>
									<SelectItem value="SAIDA">Despesa (Saída)</SelectItem>
									<SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DialogFooter className="gap-2">
							<Button type="button" variant="outline" onClick={() => setEditTarget(null)} className="border-slate-200 rounded-sm h-10 text-sm">Cancelar</Button>
							<Button type="submit" disabled={updateCategory.isPending} className="bg-primary hover:bg-primary text-white rounded-sm h-10 text-sm px-6">
								{updateCategory.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Guardar'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
