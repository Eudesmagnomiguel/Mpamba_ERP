'use client';

import React from 'react';
import { Tags, Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useCostCenters } from '@/hooks/module/treasury';

export default function CostCentersPage() {
	const { data: costCenters = [], isLoading } = useCostCenters();

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Centros de Custo</h1>
					<p className="text-slate-500 text-sm mt-1">Organize as suas despesas por projetos, departamentos ou filiais.</p>
				</div>
				<Button className="bg-primary hover:bg-primary text-white gap-2 h-11 px-5 rounded-sm">
					<Plus size={16} />
					Novo Centro
				</Button>
			</div>

			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
						<Input
							placeholder="Pesquisar centro de custo..."
							className="pl-9 h-10 bg-white border-slate-200 rounded-sm text-sm"
						/>
					</div>
				</CardContent>
			</Card>

			<div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-slate-50/70 border-b border-slate-200">
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Código</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
							<th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{isLoading ? (
							<tr>
								<td colSpan={4} className="px-6 py-20 text-center">
									<Loader2 size={28} className="mx-auto text-primary animate-spin" />
									<p className="text-sm font-medium text-slate-500 mt-3">A carregar centros de custo...</p>
								</td>
							</tr>
						) : costCenters.length > 0 ? (
							costCenters.map((cc) => (
								<tr key={cc.id} className="hover:bg-slate-50/50 transition-colors">
									<td className="px-6 py-4">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500">
												<Tags size={15} />
											</div>
											<span className="text-sm font-semibold text-slate-900">{cc.name}</span>
										</div>
									</td>
									<td className="px-6 py-4 text-sm text-slate-600">{cc.code || '-'}</td>
									<td className="px-6 py-4">
										{cc.isActive ? (
											<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">Activo</span>
										) : (
											<span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-100">Inactivo</span>
										)}
									</td>
									<td className="px-6 py-4 text-right">
										<Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-slate-900">Editar</Button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={4} className="px-6 py-20 text-center">
									<div className="flex flex-col items-center gap-2">
										<div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center text-slate-300">
											<Tags size={22} />
										</div>
										<div className="text-slate-500 font-medium text-sm">Nenhum centro de custo encontrado</div>
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
