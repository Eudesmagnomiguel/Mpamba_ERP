'use client';

import React from 'react';
import { ReceiptText, Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useReceivables } from '@/hooks/module/treasury';

export default function ReceivablesPage() {
	const { data: receivables = [], isLoading } = useReceivables();

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contas a Receber</h1>
					<p className="text-slate-500 text-sm mt-1">Acompanhe receitas pendentes e faturas por receber de clientes.</p>
				</div>
				<Button className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
					<Plus size={16} />
					Nova Receita
				</Button>
			</div>

			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
						<Input
							placeholder="Pesquisar contas a receber..."
							className="pl-9 h-10 bg-white border-slate-200 rounded-sm text-sm"
						/>
					</div>
				</CardContent>
			</Card>

			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-slate-50/70 border-b border-slate-200">
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Esperada</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{isLoading ? (
							<tr>
								<td colSpan={5} className="px-6 py-20 text-center">
									<Loader2 size={28} className="mx-auto text-primary animate-spin" />
									<p className="text-sm font-medium text-slate-500 mt-3">A carregar contas a receber...</p>
								</td>
							</tr>
						) : receivables.length > 0 ? (
							receivables.map((receivable) => (
								<tr key={receivable.id} className="hover:bg-slate-50/50 transition-colors">
									<td className="px-6 py-4">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500">
												<ReceiptText size={15} />
											</div>
											<span className="text-sm font-semibold text-slate-900">{receivable.description}</span>
										</div>
									</td>
									<td className="px-6 py-4 text-sm font-medium text-slate-900">
										{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(receivable.amount)}
									</td>
									<td className="px-6 py-4 text-sm text-slate-600">
										{new Date(receivable.dueDate).toLocaleDateString('pt-AO')}
									</td>
									<td className="px-6 py-4">
										{receivable.status === 'PENDENTE' ? (
											<span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-100">Pendente</span>
										) : receivable.status === 'PAGO' ? (
											<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">Recebido</span>
										) : (
											<span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-100">{receivable.status}</span>
										)}
									</td>
									<td className="px-6 py-4 text-right">
										<Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-slate-900">Gerir</Button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={5} className="px-6 py-20 text-center">
									<div className="flex flex-col items-center gap-2">
										<div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center text-slate-300">
											<ReceiptText size={22} />
										</div>
										<div className="text-slate-500 font-medium text-sm">Nenhuma conta a receber</div>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
