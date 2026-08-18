'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Plus,
	Search,
	MoreVertical,
	Edit2,
	Trash2,
	Eye,
	AlertCircle,
	CheckCircle2,
	Package,
	Filter,
	Loader2
} from 'lucide-react';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Button as UiButton } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product } from '@/shared/types/stock.types';
import { useStockProducts, useDeleteStockProduct } from '@/hooks/module/stock';

import { useHasPermission } from '@/hooks/core/usePermission';

export default function ProductsPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const router = useRouter();

	// Permissions
	const canCreateProduct = useHasPermission('stock:product:create');
	const canUpdateProduct = useHasPermission('stock:product:update');
	const canDeleteProduct = useHasPermission('stock:product:delete');

	// API Hook
	const { data: productsData, isLoading, error } = useStockProducts({
		search: searchTerm || undefined
	});

	const { mutate: deleteProduct } = useDeleteStockProduct();

	// Fix: Access .data from the paginated response
	const products = productsData?.data || [];
	const pagination = productsData?.pagination;

	const getStockStatus = (product: Product) => {
		if (!product.isActive) return { label: 'Inativo', color: 'bg-slate-100 text-slate-500 border-slate-200' };
		if (product.currentQuantity === 0) return { label: 'Sem Stock', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: AlertCircle };
		if (product.minStock && product.currentQuantity <= product.minStock) return { label: 'Stock Baixo', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: AlertCircle };
		return { label: 'Em Stock', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 };
	};

	const handleDelete = (id: string) => {
		if (confirm('Tem certeza que deseja eliminar este produto?')) {
			deleteProduct(id, {
				onSuccess: () => toast.success('Produto eliminado com sucesso'),
				onError: () => toast.error('Erro ao eliminar produto')
			});
		}
	};

	return (
		<div className="space-y-6">
			{/* Header Area */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Produtos</h1>
					<p className="text-slate-500 text-sm mt-1">Visualize e gira o inventário da sua organização.</p>
				</div>
				{canCreateProduct && (
					<Button fullWidth={false} onClick={() => router.push('/stock/products/new')} className="bg-primary hover:bg-primary text-white gap-2 h-11 px-6 rounded-sm">
						<Plus size={18} />
						Novo Produto
					</Button>
				)}
			</div>

			{/* Filters and Search */}
			<Card className="border-slate-200/60 rounded-sm shadow-sm bg-white/50 backdrop-blur-sm">
				<CardContent className="px-4 flex flex-col md:flex-row gap-4">
					<div className="relative flex-1">
						<Input
							placeholder="Pesquisar por nome ou SKU..."
							className="h-11 bg-white rounded-sm border-slate-200 focus:ring-primary/20 focus:border-primary transition-all"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<div className="flex gap-2">
						<Button fullWidth={false} variant="outline" className="h-11 border-slate-200 bg-transparent text-slate-600 gap-2 hover:bg-slate-50 rounded-sm">
							<Filter size={18} />
							Filtros
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Products Table */}
			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden min-h-100 flex flex-col">
				<div className="overflow-x-auto flex-1">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50/50 border-b border-slate-200">
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produto</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Unid.</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Preço</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Stock Atual</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
								<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading ? (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3">
											<Loader2 size={32} className="text-primary animate-spin" />
											<p className="text-sm font-medium text-slate-500">Carregando produtos...</p>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={7} className="px-6 py-20 text-center">
										<div className="flex flex-col items-center gap-3 text-rose-500">
											<AlertCircle size={32} />
											<p className="text-sm font-medium">Erro ao carregar produtos. Tente novamente.</p>
										</div>
									</td>
								</tr>
							) : products.length > 0 ? (
								products.map((product) => {
									const status = getStockStatus(product);
									const StatusIcon = status.icon;

									return (
										<tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
														<Package size={20} />
													</div>
													<div>
														<div className="font-medium text-slate-900">{product.name}</div>
														<div className="text-[10px] text-slate-400 font-mono">ID: {product.id.slice(0, 8)}</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
												{product.sku}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-600 font-medium">
												{product.unit}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
												{product.price?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center">
												<span className={cn(
													"text-sm font-bold",
													product.currentQuantity === 0 ? "text-rose-600" :
														(product.minStock && product.currentQuantity <= product.minStock) ? "text-amber-600" : "text-slate-900"
												)}>
													{product.currentQuantity}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center">
												<div className={cn(
													"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
													status.color
												)}>
													{StatusIcon && <StatusIcon size={12} />}
													{status.label}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8 bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
															<MoreVertical size={16} />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-48 p-1 shadow-xl border-slate-200">
														<DropdownMenuItem asChild>
															<Link href={`/stock/products/${product.id}`} className="flex items-center gap-2 text-slate-600 focus:text-slate-900 focus:bg-slate-50 cursor-pointer">
																<Eye size={16} />
																Visualizar Detalhes
															</Link>
														</DropdownMenuItem>
														{canUpdateProduct && (
															<DropdownMenuItem asChild>
																<Link href={`/stock/products/${product.id}/edit`} className="flex items-center gap-2 text-slate-600 focus:text-slate-900 focus:bg-slate-50 cursor-pointer">
																	<Edit2 size={16} />
																	Editar Produto
																</Link>
															</DropdownMenuItem>
														)}
														<div className="h-px bg-slate-100 my-1" />
														{canDeleteProduct && (
															<DropdownMenuItem
																onClick={() => handleDelete(product.id)}
																className="gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
															>
																<Trash2 size={16} />
																Eliminar
															</DropdownMenuItem>
														)}
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
											<div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
												<Search size={24} />
											</div>
											<div className="text-slate-500 font-medium">Nenhum produto encontrado</div>
											<div className="text-slate-400 text-xs text-balance max-w-50 mx-auto">Tente ajustar a sua pesquisa ou adicione o seu primeiro produto.</div>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination info */}
				{pagination && pagination.total > 0 && (
					<div className="px-6 py-4 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/30">
						<div className="text-xs text-slate-500 font-medium">
							Mostrando <span className="text-slate-900 font-bold">{products.length}</span> de <span className="text-slate-900 font-bold">{pagination.total}</span> produtos
						</div>
						<div className="flex flex-wrap gap-2 sm:justify-end">
							<UiButton variant="outline" size="sm" disabled={pagination.page === 1} className="h-8 text-xs px-4 rounded-sm">
								Anterior
							</UiButton>
							<UiButton variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} className="h-8 text-xs px-4 rounded-sm">
								Próximo
							</UiButton>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
