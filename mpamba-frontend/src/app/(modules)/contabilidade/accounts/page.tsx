'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
	ListTree,
	Plus,
	Search,
	MoreVertical,
	Loader2,
	AlertCircle,
	Pencil,
	Trash2,
	CheckCircle,
	XCircle,
	BookOpen,
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
	useAccountingAccounts,
	useCreateAccountingAccount,
	useUpdateAccountingAccount,
	useDeleteAccountingAccount,
} from '@/hooks/module/accounting';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateAccountingAccountSchema, CreateAccountingAccountDto, UpdateAccountingAccountDto } from '@/shared/dto/accounting.dto';
import { AccountingAccount } from '@/shared/types/accounting.types';
import { compareAccountCodes } from '@/shared/utils/accounting.utils';
import { toast } from 'sonner';

// Classes do PGC-Angola (Decreto n.º 82/01 de 16 de Novembro). A ordem das
// classes é a do decreto, que a trocou face ao plano anterior.
const CLASS_LABELS: Record<number, string> = {
	1: 'Meios Fixos e Investimentos',
	2: 'Existências',
	3: 'Terceiros',
	4: 'Meios Monetários',
	5: 'Capital e Reservas',
	6: 'Proveitos e Ganhos por Natureza',
	7: 'Custos e Perdas por Natureza',
	8: 'Resultados',
};

const SIDE_LABELS: Record<string, string> = {
	ATIVO: 'Ativo',
	PASSIVO: 'Passivo',
	CAPITAL_PROPRIO: 'Capital Próprio',
	CUSTO: 'Custo',
	PROVEITO: 'Proveito',
};

export default function AccountingAccountsPage() {
	const router = useRouter();
	const [search, setSearch] = useState('');
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<AccountingAccount | null>(null);

	const { data: accounts, isLoading, error } = useAccountingAccounts();
	const createAccount = useCreateAccountingAccount();
	const updateAccount = useUpdateAccountingAccount();
	const deleteAccount = useDeleteAccountingAccount();

	const createForm = useForm<CreateAccountingAccountDto>({
		resolver: zodResolver(CreateAccountingAccountSchema),
		defaultValues: { side: 'ATIVO' },
	});

	const editForm = useForm<UpdateAccountingAccountDto>();

	// No PGC a classe é sempre o primeiro dígito do código (34.5.3 → classe 3),
	// por isso é derivada e não escolhida, para não poder contradizer o código.
	const codeValue = createForm.watch('code');
	const derivedClass = codeValue && /^[1-8]/.test(codeValue) ? Number(codeValue[0]) : undefined;
	useEffect(() => {
		if (derivedClass) createForm.setValue('class', derivedClass);
	}, [derivedClass, createForm]);

	const filtered = useMemo(() => {
		const list = accounts || [];
		if (!search) return list;
		const q = search.toLowerCase();
		return list.filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
	}, [accounts, search]);

	const grouped = useMemo(() => {
		const map = new Map<number, AccountingAccount[]>();
		for (const acc of filtered) {
			const list = map.get(acc.class) || [];
			list.push(acc);
			map.set(acc.class, list);
		}
		return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
	}, [filtered]);

	const handleCreate = createForm.handleSubmit(async (data) => {
		try {
			await createAccount.mutateAsync(data);
			toast.success('Conta criada com sucesso!');
			setIsCreateOpen(false);
			createForm.reset({ side: 'ATIVO' });
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao criar a conta.');
		}
	});

	const handleEdit = editForm.handleSubmit(async (data) => {
		if (!editTarget) return;
		try {
			await updateAccount.mutateAsync({ id: editTarget.id, data });
			toast.success('Conta actualizada!');
			setEditTarget(null);
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao actualizar a conta.');
		}
	});

	const handleDelete = async (id: string) => {
		try {
			await deleteAccount.mutateAsync(id);
			toast.success('Conta eliminada.');
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Erro ao eliminar a conta.');
		}
	};

	const openEdit = (acc: AccountingAccount) => {
		setEditTarget(acc);
		editForm.reset({ name: acc.name, isActive: acc.isActive });
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Plano de Contas</h1>
					<p className="text-slate-500 text-sm mt-1">
						Estrutura contabilística da organização, segundo o PGC-Angola (classes 1 a 8).{' '}
						<Link href="/contabilidade/pgc" className="font-semibold text-primary hover:underline">
							Consultar o decreto
						</Link>
					</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
					<Plus size={16} />
					Nova Conta
				</Button>
			</div>

			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3 flex gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
						<Input
							placeholder="Pesquisar por código ou nome..."
							className="pl-9 h-10 bg-white border-slate-200 rounded-sm text-sm"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			{isLoading ? (
				<div className="flex items-center justify-center h-48">
					<Loader2 size={28} className="text-primary animate-spin" />
				</div>
			) : error ? (
				<div className="p-6 bg-rose-50 border border-rose-100 rounded-sm text-rose-600 flex items-center gap-3">
					<AlertCircle size={20} />
					<p className="text-sm font-medium">Erro ao carregar o plano de contas.</p>
				</div>
			) : grouped.length > 0 ? (
				<div className="space-y-5">
					{grouped.map(([classNum, list]) => (
						<Card key={classNum} className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
							<div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
								<span className="w-6 h-6 rounded-sm bg-primary/10 text-primary text-xs font-black flex items-center justify-center">{classNum}</span>
								<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{CLASS_LABELS[classNum] || `Classe ${classNum}`}</span>
							</div>
							<div className="divide-y divide-slate-100">
								{[...list].sort((a, b) => compareAccountCodes(a.code, b.code)).map((acc) => (
									<div key={acc.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors">
										<div className="flex items-center gap-3 min-w-0">
											<span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm shrink-0">{acc.code}</span>
											<span className="text-sm font-medium text-slate-900 truncate">{acc.name}</span>
											{acc.isActive ? (
												<span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100 shrink-0">
													<CheckCircle size={10} /> Activa
												</span>
											) : (
												<span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-100 shrink-0">
													<XCircle size={10} /> Inactiva
												</span>
											)}
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-sm shrink-0">
													<MoreVertical size={15} />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-44 p-1 rounded-sm shadow-lg border-slate-200">
												<DropdownMenuItem className="gap-2 cursor-pointer rounded-sm text-xs" onClick={() => router.push(`/contabilidade/reports/ledger/${acc.id}`)}>
													<BookOpen size={13} />
													Ver Razão
												</DropdownMenuItem>
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
									</div>
								))}
							</div>
						</Card>
					))}
				</div>
			) : (
				<div className="bg-white border border-slate-200 rounded-sm py-20 flex flex-col items-center gap-3 text-slate-400">
					<ListTree size={36} className="opacity-30" />
					<p className="text-sm font-medium text-slate-500">Nenhuma conta encontrada</p>
				</div>
			)}

			{/* ── Create Dialog ── */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-md rounded-sm">
					<DialogHeader>
						<DialogTitle className="text-slate-900 font-bold">Nova Conta Contabilística</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleCreate} className="space-y-4 mt-2">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Código *</label>
								<Input placeholder="Ex: 34.5.3" className="h-10 border-slate-200 rounded-sm text-sm" {...createForm.register('code')} />
								{createForm.formState.errors.code && <p className="text-[10px] text-rose-500">{createForm.formState.errors.code.message}</p>}
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-700">Classe</label>
								<div className="h-10 flex items-center px-3 border border-slate-200 rounded-sm bg-slate-50 text-sm text-slate-600 truncate">
									{derivedClass ? `${derivedClass} — ${CLASS_LABELS[derivedClass]}` : 'Definida pelo código'}
								</div>
							</div>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Lado Contabilístico *</label>
							<Select defaultValue="ATIVO" onValueChange={(v) => createForm.setValue('side', v as CreateAccountingAccountDto['side'])}>
								<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(SIDE_LABELS).map(([value, label]) => (
										<SelectItem key={value} value={value}>{label}</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-[10px] text-slate-400">Usado na Demonstração de Resultados e no Balanço.</p>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Nome da Conta *</label>
							<Input placeholder="Ex: Outros Devedores" className="h-10 border-slate-200 rounded-sm text-sm" {...createForm.register('name')} />
							{createForm.formState.errors.name && <p className="text-[10px] text-rose-500">{createForm.formState.errors.name.message}</p>}
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">Conta-mãe (opcional)</label>
							<Select onValueChange={(v) => createForm.setValue('parentId', v === 'none' ? null : v)}>
								<SelectTrigger className="h-10 border-slate-200 rounded-sm text-sm">
									<SelectValue placeholder="Nenhuma" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Nenhuma</SelectItem>
									{(accounts || []).map((acc) => (
										<SelectItem key={acc.id} value={acc.id}>{acc.code} — {acc.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
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
						<div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-sm border border-slate-100">
							<div>
								<label className="text-xs font-semibold text-slate-700">Activa</label>
								<p className="text-[10px] text-slate-400">Desactivar impede novos lançamentos nesta conta.</p>
							</div>
							<input
								type="checkbox"
								className="w-4 h-4 accent-primary cursor-pointer"
								checked={editForm.watch('isActive') ?? true}
								onChange={(e) => editForm.setValue('isActive', e.target.checked)}
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
