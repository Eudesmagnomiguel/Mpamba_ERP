'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
	Search,
	ArrowDownCircle,
	ArrowUpCircle,
	RefreshCcw,
	Calendar,
	User,
	Package,
	MoreVertical,
	ExternalLink,
	FileText,
	Loader2,
	AlertCircle,
	X,
	ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useStockMovements, useStockProduct } from '@/hooks/module/stock';
import Link from 'next/link';

function MovementsPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const productIdFilter = searchParams.get('productId') || undefined;

	const [searchTerm, setSearchTerm] = useState('');
	const [typeFilter, setTypeFilter] = useState('');
	const [page, setPage] = useState(1);

	const { data: filteredProduct } = useStockProduct(productIdFilter || '');

	// API Hook
	const { data: movementsData, isLoading, error } = useStockMovements({
		productId: productIdFilter,
		type: (typeFilter || undefined) as any,
		page,
		pageSize: 20,
	});

	const allMovements = movementsData?.data || [];
	const pagination = movementsData?.pagination;

	const movements = useMemo(() => {
		if (!searchTerm.trim()) return allMovements;
		const term = searchTerm.trim().toLowerCase();
		return allMovements.filter((mv) =>
			mv.product?.name?.toLowerCase().includes(term) ||
			mv.product?.sku?.toLowerCase().includes(term) ||
			mv.reference?.toLowerCase().includes(term) ||
			mv.reason?.toLowerCase().includes(term)
		);
	}, [allMovements, searchTerm]);

	const clearProductFilter = () => {
		setPage(1);
		router.push('/stock/movements');
	};

	const getMovementBadge = (type: string) => {
		switch (type) {
			case 'ENTRADA':
				return {
					label: 'Entrada',
					color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
					icon: ArrowDownCircle
				};
			case 'SAIDA':
				return {
					label: 'Saída',
					color: 'bg-rose-50 text-rose-600 border-rose-100',
					icon: ArrowUpCircle
				};
			case 'AJUSTE':
				return {
					label: 'Ajuste',
					color: 'bg-amber-50 text-amber-600 border-amber-100',
					icon: RefreshCcw
				};
			default:
				return { label: type, color: 'bg-slate-50 text-slate-600 border-slate-100', icon: FileText };
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Histórico de Movimentos</h1>
					<p className="text-slate-500 text-sm mt-1">Registo completo de todas as entradas, saídas e ajustes de stock.</p>
				</div>
			</div>

			{/* Product filter chip */}
			{productIdFilter && (
				<div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-sm text-sm text-primary font-semibold w-fit">
					<Package size={14} />
					Produto: {filteredProduct?.name || '...'}
					<button
						onClick={clearProductFilter}
						className="ml-1 text-primary/60 hover:text-primary transition-colors"
						title="Remover filtro"
					>
						<X size={14} />
					</button>
				</div>
			)}

			{/* Filters */}
			<Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm rounded-sm">
				<CardContent className="px-4 flex flex-col md:flex-row gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
						<Input
							placeholder="Pesquisar por produto, referência ou motivo..."
							className="pl-10 h-11 bg-white border-slate-200 rounded-sm"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<div className="relative">
						<select
							value={typeFilter}
							onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
							className="h-11 appearance-none bg-white border border-slate-200 rounded-sm pl-4 pr-9 text-sm font-medium text-slate-600 outline-none focus:border-primary transition-all cursor-pointer"
						>
							<option value="">Todos os tipos</option>
							<option value="ENTRADA">Entrada</option>
							<option value="SAIDA">Saída</option>
							<option value="AJUSTE">Ajuste</option>
						</select>
						<ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
					</div>
				</CardContent>
			</Card>

			{/* Movements Table */}
			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
				<div className="overflow-x-auto flex-1">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50/50 border-b border-slate-200">
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data & Hora</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produto</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Tipo</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Qtd.</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referência</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilizador</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading ? (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3">
											<Loader2 size={32} className="text-primary animate-spin" />
											<p className="text-sm font-medium text-slate-500">Carregando movimentos...</p>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center text-rose-500">
										<AlertCircle size={32} className="mx-auto" />
										<p className="text-sm font-medium mt-2">Erro ao carregar o histórico.</p>
									</td>
								</tr>
							) : movements.length > 0 ? (
								movements.map((mv) => {
									const badge = getMovementBadge(mv.type);
									const Icon = badge.icon;

									return (
										<tr key={mv.id} className="hover:bg-slate-50/50 transition-colors group">
											<td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
												<div className="font-medium text-slate-900">
													{new Date(mv.createdAt).toLocaleDateString('pt-AO')}
												</div>
												<div className="text-[10px] text-slate-400 uppercase font-bold">
													{new Date(mv.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-400">
														<Package size={16} />
													</div>
													<div>
														<div className="text-sm font-semibold text-slate-900">{mv.product?.name}</div>
														<div className="text-[10px] font-mono text-slate-500">{mv.product?.sku}</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center">
												<div className={cn(
													"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider",
													badge.color
												)}>
													<Icon size={12} />
													{badge.label}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center">
												<span className={cn(
													"text-sm font-bold",
													mv.type === 'ENTRADA' ? "text-emerald-600" :
														mv.type === 'SAIDA' ? "text-rose-600" : "text-amber-600"
												)}>
													{mv.type === 'ENTRADA' ? '+' : ''}{mv.quantity}
												</span>
												<span className="ml-1 text-[10px] text-slate-400 font-medium uppercase">{mv.product?.unit}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-slate-700 font-medium">{mv.reference || '---'}</div>
												<div className="text-[10px] text-slate-400 truncate max-w-[150px] italic">{mv.reason}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<div className="w-6 h-6 rounded-sm bg-slate-200 flex items-center justify-center text-slate-500">
														<User size={12} />
													</div>
													<span className="text-xs text-slate-600 font-medium">{mv.user?.name}</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-sm">
															<MoreVertical size={16} />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-48 p-1 rounded-sm shadow-lg border-slate-200">
														<DropdownMenuItem asChild>
															<Link href={`/stock/products/${mv.productId}`} className="flex items-center gap-2 cursor-pointer focus:bg-slate-50 rounded-sm">
																<ExternalLink size={14} />
																Ver Produto
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem className="gap-2 cursor-pointer focus:bg-slate-50 rounded-sm">
															<FileText size={14} />
															Detalhes do Movimento
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
												<RefreshCcw size={24} />
											</div>
											<div className="text-slate-500 font-medium">Nenhum movimento registrado</div>
											<div className="text-slate-400 text-xs">As operações de stock aparecerão aqui.</div>
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
							Mostrando <span className="text-slate-900 font-bold">{movements.length}</span> de <span className="text-slate-900 font-bold">{pagination.total}</span> movimentos
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={!pagination.hasPreviousPage}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="h-8 text-xs px-4 border-slate-200 rounded-sm"
							>
								Anterior
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={!pagination.hasNextPage}
								onClick={() => setPage((p) => p + 1)}
								className="h-8 text-xs px-4 border-slate-200 rounded-sm"
							>
								Próximo
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function MovementsPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[400px] w-full items-center justify-center">
					<Loader2 size={32} className="animate-spin text-primary" />
				</div>
			}
		>
			<MovementsPageContent />
		</Suspense>
	);
}
