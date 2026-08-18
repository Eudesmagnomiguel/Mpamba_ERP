'use client';

import React, { useState } from 'react';
import {
	Search,
	Filter,
	ArrowUpCircle,
	User,
	MoreVertical,
	ExternalLink,
	FileText,
	Minus,
	Loader2,
	AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button as UiButton } from '@/components/ui/button';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useStockMovements } from '@/hooks/module/stock';
import Link from 'next/link';
import { CreateExitModal } from './components/CreateExitModal';

import { useHasPermission } from '@/hooks/core/usePermission';

export default function ExitsPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const canCreateExit = useHasPermission('stock:exit:create');

	// API Hook filtered by SAIDA
	const { data: exitsData, isLoading, error } = useStockMovements({
		type: 'SAIDA'
	});

	const exits = exitsData?.data || [];
	const pagination = exitsData?.pagination;

	// Optional client side filtering for search term
	const filteredExits = exits.filter((ex: any) => {
		if (!searchTerm) return true;
		const searchLower = searchTerm.toLowerCase();
		return (
			ex.product?.name?.toLowerCase().includes(searchLower) ||
			ex.product?.sku?.toLowerCase().includes(searchLower) ||
			ex.reference?.toLowerCase().includes(searchLower)
		);
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Saídas de Stock</h1>
					<p className="text-slate-500 text-sm mt-1">Gira e visualize todas as baixas e vendas de mercadoria.</p>
				</div>
				{canCreateExit && (
					<Button
						fullWidth={false}
						onClick={() => setIsCreateOpen(true)}
						className="bg-rose-600 hover:bg-rose-700 text-white gap-2 h-11 px-6 rounded-sm"
					>
						<Minus size={18} />
						Nova Saída
					</Button>
				)}
			</div>

			{/* Filters */}
			<Card className="border-slate-200/60 rounded-sm shadow-sm bg-white/50 backdrop-blur-sm">
				<CardContent className="px-4 flex flex-col md:flex-row gap-4">
					<div className="relative flex-1">
						<Input
							placeholder="Pesquisar por produto ou referência..."
							className="h-11 bg-white rounded-sm border-slate-200 focus:ring-primary/20 focus:border-primary transition-all"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<UiButton variant="outline" className="h-11 border-slate-200 text-slate-600 gap-2 rounded-sm shrink-0">
						<Filter size={18} />
						Filtrar Data
					</UiButton>
				</CardContent>
			</Card>

			{/* Exits Table */}
			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
				<div className="overflow-x-auto flex-1">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50/50 border-b border-slate-200">
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produto</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Qtd.</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referência</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Autorizado por</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading ? (
								<tr>
									<td colSpan={6} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3">
											<Loader2 size={32} className="text-rose-600 animate-spin" />
											<p className="text-sm font-medium text-slate-500">A carregar saídas...</p>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={6} className="px-6 py-20 text-center text-rose-500">
										<AlertCircle size={32} className="mx-auto" />
										<p className="text-sm font-medium mt-2">Erro ao carregar saídas.</p>
									</td>
								</tr>
							) : filteredExits.length > 0 ? (
								filteredExits.map((ex: any) => (
									<tr key={ex.id} className="hover:bg-slate-50/50 transition-colors group">
										<td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
											<div className="font-medium text-slate-900">
												{new Date(ex.createdAt).toLocaleDateString('pt-AO')}
											</div>
											<div className="text-[10px] text-slate-400 font-bold uppercase">
												{new Date(ex.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center">
													<ArrowUpCircle size={16} />
												</div>
												<div>
													<div className="text-sm font-semibold text-slate-900">{ex.product?.name}</div>
													<div className="text-[10px] font-mono text-slate-500">{ex.product?.sku}</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-center">
											<span className="text-sm font-bold text-rose-600">
												-{ex.quantity}
											</span>
											<span className="ml-1 text-[10px] text-slate-400 font-medium uppercase">{ex.product?.unit}</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-slate-700 font-medium">{ex.reference || '---'}</div>
											<div className="text-[10px] text-slate-400 truncate max-w-[150px] italic">{ex.reason || 'Sem motivo'}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center gap-2">
												<div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
													{ex.user?.urlImageProfile ? (
														<img src={ex.user.urlImageProfile} alt={ex.user.name} className="w-full h-full object-cover" />
													) : (
														<User size={12} />
													)}
												</div>
												<span className="text-xs text-slate-600 font-medium">{ex.user?.name}</span>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<UiButton variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm">
														<MoreVertical size={16} />
													</UiButton>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-48 p-1 shadow-xl border-slate-200 rounded-sm">
													<DropdownMenuItem asChild>
														<Link href={`/stock/products/${ex.productId}`} className="flex items-center gap-2 cursor-pointer focus:bg-slate-50 rounded-sm">
															<ExternalLink size={14} />
															Ver Produto
														</Link>
													</DropdownMenuItem>
													<div className="h-px bg-slate-100 my-1" />
													<DropdownMenuItem className="gap-2 cursor-pointer focus:bg-slate-50 rounded-sm">
														<FileText size={14} />
														Comprovativo
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={6} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-2">
											<div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
												<ArrowUpCircle size={24} />
											</div>
											<div className="text-slate-500 font-medium">Nenhuma saída encontrada</div>
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
							A mostrar <span className="text-slate-900 font-bold">{filteredExits.length}</span> de <span className="text-slate-900 font-bold">{pagination.total}</span> saídas
						</div>
					</div>
				)}
			</div>

			<CreateExitModal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
			/>
		</div>
	);
}
