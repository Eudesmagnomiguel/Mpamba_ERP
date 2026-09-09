'use client';

import React, { useState } from 'react';
import {
	Boxes,
	TrendingUp,
	AlertCircle,
	PackagePlus,
	ScanLine,
	BarChart3,
	Loader2,
	FileSpreadsheet,
	FileText,
	CalendarClock
} from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { useStockSummary } from '@/hooks/module/stock';
import { reportService } from '@/services/module/stock/report.service';
import { getApiErrorMessage } from '@/shared/utils/api-error.utils';
import { downloadBlob, fileDateSuffix, getDownloadErrorMessage } from '@/shared/utils/download.utils';
import { cn } from '@/lib/utils';
import {
	AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
	PieChart, Pie, Cell
} from 'recharts';

export default function StockPage() {
	const { data: summary, isLoading, error } = useStockSummary();
	const [isExporting, setIsExporting] = useState(false);

	const handleExportReport = async (format: 'csv' | 'excel') => {
		setIsExporting(true);
		try {
			const blob =
				format === 'excel'
					? await reportService.exportReportExcel()
					: await reportService.exportReport();
			downloadBlob(blob, `relatorio-stock-${fileDateSuffix()}.${format === 'excel' ? 'xlsx' : 'csv'}`);
			toast.success('Relatório exportado com sucesso.');
		} catch (err: any) {
			toast.error(await getDownloadErrorMessage(err, 'Erro ao gerar o relatório.'));
		} finally {
			setIsExporting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-center gap-3">
				<AlertCircle size={24} />
				<p className="font-medium">{getApiErrorMessage(error, 'Erro ao carregar os dados do dashboard.')}</p>
			</div>
		);
	}

	// Default empty data if summary is missing
	const stats = summary || {
		totalProducts: 0,
		lowStockItems: 0,
		expiredItems: 0,
		expiringSoonItems: 0,
		totalQuantity: 0,
		totalInventoryValue: 0,
		evolutionData: [],
		categoryData: []
	};

	return (
		<div className="space-y-8 animate-in fade-in duration-700">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Inventário</h1>
					<p className="text-slate-500 text-sm mt-1">Acompanhe o fluxo de stock e valor total do seu património.</p>
				</div>
				<div className="flex gap-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								disabled={isExporting}
								className="h-11 border-slate-200 text-slate-600 gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 disabled:opacity-60"
							>
								{isExporting ? <Loader2 size={18} className="animate-spin" /> : <BarChart3 size={18} />}
								Gerar Relatório
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => handleExportReport('excel')} className="gap-2">
								<FileSpreadsheet size={16} />
								Excel (.xlsx)
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => handleExportReport('csv')} className="gap-2">
								<FileText size={16} />
								CSV
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button asChild className="bg-primary hover:bg-primary text-white shadow-lg shadow-primary/10 gap-2 h-11 px-6 rounded-lg transition-all active:scale-95">
						<Link href="/stock/movements">
							<PackagePlus size={18} />
							Novo Movimento
						</Link>
					</Button>
				</div>
			</div>

			{stats.expiredItems + stats.expiringSoonItems > 0 ? (
				<Link
					href="/stock/products"
					className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-100"
				>
					<CalendarClock size={18} className="shrink-0" />
					<span className="font-medium">
						{stats.expiredItems > 0 ? (
							<>
								<strong>{stats.expiredItems}</strong> {stats.expiredItems === 1 ? 'produto expirado' : 'produtos expirados'}
							</>
						) : null}
						{stats.expiredItems > 0 && stats.expiringSoonItems > 0 ? ' · ' : null}
						{stats.expiringSoonItems > 0 ? (
							<>
								<strong>{stats.expiringSoonItems}</strong> {stats.expiringSoonItems === 1 ? 'produto expira' : 'produtos expiram'} nos próximos 30 dias
							</>
						) : null}
					</span>
					<span className="ml-auto shrink-0 text-xs font-bold uppercase tracking-wider">Ver produtos</span>
				</Link>
			) : null}

			{/* Main KPI Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden group">
					<CardContent className="p-6">
						<div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
							<Boxes size={24} />
						</div>
						<div className="mt-4">
							<div className="text-3xl font-bold text-slate-900 tracking-tight">{stats.totalProducts}</div>
							<div className="text-sm text-slate-500 font-medium mt-1">Produtos Ativos</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden group">
					<CardContent className="p-6">
						<div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
							<AlertCircle size={24} />
						</div>
						<div className="mt-4">
							<div className="text-3xl font-bold text-slate-900 tracking-tight">{stats.lowStockItems}</div>
							<div className="text-sm text-slate-500 font-medium mt-1">Stock Crítico</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden group">
					<CardContent className="p-6">
						<div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
							<ScanLine size={24} />
						</div>
						<div className="mt-4">
							<div className="text-3xl font-bold text-slate-900 tracking-tight">{stats.totalQuantity.toLocaleString()}</div>
							<div className="text-sm text-slate-500 font-medium mt-1">Unidades em Stock</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden group">
					<CardContent className="p-6">
						<div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
							<TrendingUp size={24} />
						</div>
						<div className="mt-4">
							<div className="text-3xl font-bold text-slate-900 tracking-tight">
								{new Intl.NumberFormat('pt-AO', { notation: "compact", compactDisplay: "short" }).format(stats.totalInventoryValue)} Kz
							</div>
							<div className="text-sm text-slate-500 font-medium mt-1">Valor Estimado</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Area */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Evolution Chart */}
				<Card className="lg:col-span-2 border-none shadow-sm rounded-xl bg-white overflow-hidden">
					<CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
						<div>
							<CardTitle className="text-lg font-bold text-slate-900">Evolução do Valor de Inventário</CardTitle>
							<p className="text-xs text-slate-400 mt-1">Performance financeira do stock nos últimos meses.</p>
						</div>
						<div className="flex items-center gap-2">
							<div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
								<div className="w-2 h-2 rounded-full bg-emerald-500" />
								<span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Valor Ativo</span>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-6">
						<div className="h-[320px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={stats.evolutionData.length > 0 ? stats.evolutionData : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
									<defs>
										<linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#483061" stopOpacity={0.1} />
											<stop offset="95%" stopColor="#483061" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
									<XAxis
										dataKey="name"
										axisLine={false}
										tickLine={false}
										tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
										dy={10}
									/>
									<YAxis
										axisLine={false}
										tickLine={false}
										tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
										tickFormatter={(value) => `${value / 1000}k`}
									/>
									<RechartsTooltip
										contentStyle={{
											borderRadius: '12px',
											border: 'none',
											boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
											padding: '12px'
										}}
										itemStyle={{ fontSize: '12px', fontWeight: '600' }}
										labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}
									/>
									<Area
										type="monotone"
										dataKey="value"
										stroke="#483061"
										strokeWidth={3}
										fillOpacity={1}
										fill="url(#chartGradient)"
										activeDot={{ r: 6, strokeWidth: 0, fill: '#483061' }}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Category Pie */}
				<Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden self-start">
					<CardHeader className="p-6 pb-0">
						<CardTitle className="text-base font-bold text-slate-900">Distribuição por Categoria</CardTitle>
					</CardHeader>
					<CardContent className="p-6">
						<div className="h-[240px] w-full flex items-center justify-center relative">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={stats.categoryData.length > 0 ? stats.categoryData : []}
										cx="50%"
										cy="50%"
										innerRadius={65}
										outerRadius={85}
										paddingAngle={8}
										dataKey="value"
										stroke="none"
									>
										{(stats.categoryData || []).map((entry: any, index: number) => (
											<Cell key={`cell-${index}`} fill={entry.color || '#483061'} />
										))}
									</Pie>
									<RechartsTooltip />
								</PieChart>
							</ResponsiveContainer>
							<div className="absolute flex flex-col items-center justify-center pointer-events-none">
								<span className="text-xl font-bold text-slate-900">
									{stats.categoryData.length > 0 ? '100%' : '0%'}
								</span>
								<span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total Stock</span>
							</div>
						</div>
						{stats.categoryData.length === 0 && (
							<p className="text-xs text-slate-400 text-center mt-4">Sem dados de categoria para apresentar.</p>
						)}
						<div className="mt-6 grid grid-cols-1 gap-3">
							{(stats.categoryData || []).map((cat: any, i: number) => (
								<div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
									<div className="flex items-center gap-3">
										<div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
										<span className="text-xs font-bold text-slate-800 truncate">{cat.name}</span>
									</div>
									<span className="text-xs text-slate-500 font-medium">{cat.value}%</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
