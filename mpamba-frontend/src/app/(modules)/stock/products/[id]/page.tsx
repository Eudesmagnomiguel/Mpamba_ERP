'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
	ArrowLeft,
	Edit2,
	Package,
	History,
	BarChart3,
	AlertCircle,
	CheckCircle2,
	ArrowDownCircle,
	ArrowUpCircle,
	RefreshCcw,
	Calendar,
	Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useStockProduct, useStockMovements } from '@/hooks/module/stock';

export default function ProductDetailPage() {
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const productId = params?.id as string;

	const { data: product, isLoading: isProductLoading } = useStockProduct(productId);
	const { data: movementsData, isLoading: isMovementsLoading } = useStockMovements({
		productId: productId,
		pageSize: 10
	});

	const movements = movementsData?.data || [];

	if (isProductLoading) {
		return (
			<div className="flex h-[400px] w-full items-center justify-center">
				<Loader2 size={32} className="animate-spin text-primary" />
			</div>
		);
	}

	if (!product) {
		return (
			<div className="flex h-[400px] w-full flex-col items-center justify-center gap-4">
				<AlertCircle size={48} className="text-rose-500" />
				<h2 className="text-xl font-bold text-slate-900">Produto não encontrado</h2>
				<Button onClick={() => router.back()} variant="outline" className="rounded-sm">Voltar</Button>
			</div>
		);
	}

	const getStockStatus = () => {
		if (!product.isActive) return { label: 'Inativo', color: 'bg-slate-100 text-slate-500', icon: AlertCircle };
		if (product.currentQuantity === 0) return { label: 'Sem Stock', color: 'bg-rose-50 text-rose-600', icon: AlertCircle };
		if (product.minStock && product.currentQuantity <= product.minStock) return { label: 'Stock Baixo', color: 'bg-amber-50 text-amber-600', icon: AlertCircle };
		return { label: 'Em Stock', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 };
	};

	const status = getStockStatus();
	const StatusIcon = status.icon;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
						className="rounded-sm hover:bg-slate-100"
					>
						<ArrowLeft size={20} />
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
							<div className={cn(
								"inline-flex items-center gap-1.5 rounded-sm border border-transparent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
								status.color
							)}>
								<StatusIcon size={12} />
								{status.label}
							</div>
						</div>
						<p className="mt-1 text-sm text-slate-500">SKU: <span className="font-mono">{product.sku}</span></p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline" className="h-11 gap-2 rounded-sm border-slate-200 px-6 text-slate-600">
						<Link href={`/stock/movements?productId=${product.id}`}>
							<History size={18} />
							Histórico
						</Link>
					</Button>
					<Button asChild className="h-11 gap-2 rounded-sm bg-primary px-6 text-white shadow-lg shadow-primary/20 hover:bg-primary">
						<Link href={`/stock/products/${product.id}/edit`}>
							<Edit2 size={18} />
							Editar Produto
						</Link>
					</Button>
				</div>
			</div>

			{/* Content Grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Info Cards */}
				<div className="space-y-6 lg:col-span-2">
					<Card className="overflow-hidden rounded-sm border-slate-200 shadow-sm">
						<CardHeader className="border-b border-slate-100 bg-slate-50/50">
							<CardTitle className="flex items-center gap-2 text-lg font-bold">
								<Package size={20} className="text-primary" />
								Informações Gerais
							</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nome do Produto</p>
								<p className="font-medium text-slate-900">{product.name}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unidade de Medida</p>
								<p className="font-medium text-slate-900">{product.unit}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preço de Venda (AOA)</p>
								<p className="text-lg font-bold text-slate-900">{product.price?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stock Mínimo</p>
								<p className="font-bold text-amber-600">{product.minStock || 0} {product.unit}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stock Máximo</p>
								<p className="font-bold text-slate-900">{product.maxStock != null ? `${product.maxStock} ${product.unit}` : 'Não definido'}</p>
							</div>
							<div className="space-y-1 md:col-span-2">
								<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Descrição</p>
								<p className="text-sm leading-relaxed text-slate-600">{product.description || 'Sem descrição disponível.'}</p>
							</div>
						</CardContent>
					</Card>

					{/* Movement History */}
					<Card className="overflow-hidden rounded-sm border-slate-200 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50">
							<CardTitle className="flex items-center gap-2 text-lg font-bold">
								<History size={20} className="text-primary" />
								Movimentos Recentes
							</CardTitle>
							<Link
								href={`/stock/movements?productId=${product.id}`}
								className="text-xs font-bold text-primary hover:underline"
							>
								Ver histórico completo
							</Link>
						</CardHeader>
						<CardContent className="p-0">
							<table className="w-full text-left">
								<thead className="border-b border-slate-100 bg-slate-50/30">
									<tr>
										<th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Data</th>
										<th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
										<th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Qtd.</th>
										<th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Responsável</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{isMovementsLoading ? (
										<tr>
											<td colSpan={4} className="py-8 text-center text-slate-500">
												<Loader2 size={24} className="mx-auto animate-spin text-slate-400" />
											</td>
										</tr>
									) : movements.length === 0 ? (
										<tr>
											<td colSpan={4} className="py-8 text-center text-sm text-slate-500">Nenhum movimento registado.</td>
										</tr>
									) : (
										movements.map((mv) => (
											<tr key={mv.id} className="transition-colors hover:bg-slate-50/50">
												<td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
													{new Date(mv.createdAt).toLocaleDateString('pt-AO')}
												</td>
												<td className="whitespace-nowrap px-6 py-4">
													<div className={cn(
														"inline-flex items-center gap-1 text-[10px] font-bold uppercase",
														mv.type === 'ENTRADA' ? "text-emerald-600" :
															mv.type === 'SAIDA' ? "text-rose-600" : "text-amber-600"
													)}>
														{mv.type === 'ENTRADA' && <ArrowDownCircle size={12} />}
														{mv.type === 'SAIDA' && <ArrowUpCircle size={12} />}
														{mv.type === 'AJUSTE' && <RefreshCcw size={12} />}
														{mv.type}
													</div>
												</td>
												<td className={cn(
													"whitespace-nowrap px-6 py-4 text-right text-sm font-bold",
													mv.type === 'ENTRADA' ? "text-emerald-600" :
														mv.type === 'SAIDA' ? "text-rose-600" : "text-amber-600"
												)}>
													{mv.type === 'ENTRADA' ? '+' : ''}{mv.quantity}
												</td>
												<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
													{mv.user?.name || 'Sistema'}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar Info */}
				<div className="space-y-6">
					<Card className="relative overflow-hidden rounded-sm border-slate-200 bg-linear-to-br from-primary to-primary text-white shadow-sm">
						<div className="absolute right-0 top-0 p-4 opacity-10">
							<BarChart3 size={100} />
						</div>
						<CardHeader>
							<CardTitle className="text-sm font-medium uppercase tracking-widest opacity-80">Stock Atual</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="text-5xl font-black">{product.currentQuantity}</div>
							<p className="mt-2 text-sm opacity-70">{product.unit} em armazém</p>

							<div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
								<div>
									<p className="text-[10px] uppercase opacity-60">Valor Total</p>
									<p className="text-lg font-bold">{(product.currentQuantity * (product.price || 0)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
								</div>
								<div className="text-right">
									<p className="text-[10px] uppercase opacity-60">Status</p>
									<p className="text-sm font-medium">{product.isActive ? 'Ativo' : 'Inativo'}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-sm border-slate-200 shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-sm font-bold">
								<Calendar size={16} className="text-slate-400" />
								Datas Importantes
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-500">Criado em</span>
								<span className="font-medium text-slate-900">{new Date(product.createdAt).toLocaleDateString('pt-AO')}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-500">Última Atualização</span>
								<span className="font-medium text-slate-900">{new Date(product.updatedAt).toLocaleDateString('pt-AO')}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
