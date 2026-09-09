'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BookOpen, FileText, Info, Loader2, Search, Anchor } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAccountingPgcReference } from '@/hooks/module/accounting';
import type { PgcReferenceAccount } from '@/shared/types/accounting.types';

const SIDE_LABELS: Record<string, string> = {
	ATIVO: 'Ativo',
	PASSIVO: 'Passivo',
	CAPITAL_PROPRIO: 'Capital Próprio',
	CUSTO: 'Custo',
	PROVEITO: 'Proveito',
};

const SIDE_CLASSES: Record<string, string> = {
	ATIVO: 'bg-blue-50 text-blue-600 border-blue-100',
	PASSIVO: 'bg-orange-50 text-orange-600 border-orange-100',
	CAPITAL_PROPRIO: 'bg-violet-50 text-violet-600 border-violet-100',
	CUSTO: 'bg-rose-50 text-rose-600 border-rose-100',
	PROVEITO: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

/** Indentação por nível, para a hierarquia do código se ler de relance. */
const LEVEL_PADDING = ['pl-0', 'pl-6', 'pl-12'];

export default function PgcReferencePage() {
	const [search, setSearch] = useState('');
	const { data: reference, isLoading, error } = useAccountingPgcReference();

	const matches = (account: PgcReferenceAccount, query: string) =>
		account.code.includes(query) || account.name.toLowerCase().includes(query);

	// Uma classe fica de fora quando nenhuma das suas contas casa com a pesquisa.
	const classes = useMemo(() => {
		const all = reference?.classes || [];
		if (!search.trim()) return all;

		const query = search.trim().toLowerCase();
		return all
			.map((group) => ({ ...group, accounts: group.accounts.filter((account) => matches(account, query)) }))
			.filter((group) => group.accounts.length > 0);
	}, [reference, search]);

	const resultCount = classes.reduce((sum, group) => sum + group.accounts.length, 0);

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Plano Geral de Contabilidade</h1>
					<p className="text-slate-500 text-sm mt-1">
						{reference?.decree.reference || 'Decreto n.º 82/01, de 16 de Novembro'} — lista oficial das contas, para consulta.
					</p>
				</div>
				<a
					href="/pgc-decreto-82-01.pdf"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 h-11 px-5 rounded-sm border border-slate-200 bg-white text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
				>
					<FileText size={16} />
					Abrir o decreto (PDF)
				</a>
			</div>

			<div className="flex items-start gap-3 rounded-sm border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs leading-relaxed text-slate-600">
				<Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
				<p>
					Esta é a lista do decreto e não o plano da sua organização, que pode ter contas próprias e sub-contas
					desenvolvidas. Para o plano da organização, veja{' '}
					<Link href="/contabilidade/accounts" className="font-semibold text-primary hover:underline">
						Plano de Contas
					</Link>
					. {reference?.decree.note}
				</p>
			</div>

			<Card className="border-slate-200/60 shadow-sm bg-white rounded-sm">
				<CardContent className="px-4 py-3 flex gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
						<Input
							placeholder="Pesquisar por código ou nome... (ex.: 34.5, clientes, mercadorias)"
							className="pl-9 h-10 bg-white border-slate-200 rounded-sm text-sm"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div className="hidden md:flex items-center px-3 text-xs font-medium text-slate-400 whitespace-nowrap">
						{search.trim()
							? `${resultCount} ${resultCount === 1 ? 'conta' : 'contas'}`
							: `${reference?.totalAccounts ?? 0} contas`}
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
					<p className="text-sm font-medium">Erro ao carregar o plano de contas do PGC.</p>
				</div>
			) : classes.length > 0 ? (
				<div className="space-y-5">
					{classes.map((group) => (
						<Card key={group.class} className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
							<div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
								<span className="w-6 h-6 rounded-sm bg-primary/10 text-primary text-xs font-black flex items-center justify-center">
									{group.class}
								</span>
								<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{group.label}</span>
								<span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">
									{group.accounts.length} {group.accounts.length === 1 ? 'conta' : 'contas'}
								</span>
							</div>
							<div className="divide-y divide-slate-100">
								{group.accounts.map((account) => (
									<div key={account.code} className="px-5 py-2.5 hover:bg-slate-50/50 transition-colors">
										<div className={cn('flex items-center gap-3 min-w-0', LEVEL_PADDING[account.level] ?? 'pl-12')}>
											<span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm shrink-0 min-w-[4.5rem] text-center">
												{account.code}
											</span>
											<span
												className={cn(
													'text-sm truncate',
													account.level === 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
												)}
											>
												{account.name}
											</span>
											<span
												className={cn(
													'ml-auto shrink-0 inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold border uppercase tracking-wider',
													SIDE_CLASSES[account.side]
												)}
											>
												{SIDE_LABELS[account.side]}
											</span>
											{account.isAnchor ? (
												<span
													title="Conta usada pelos lançamentos automáticos da plataforma"
													className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold border border-primary/20 bg-primary/5 text-primary uppercase tracking-wider"
												>
													<Anchor size={10} />
													Automática
												</span>
											) : null}
										</div>
										{account.note ? (
											<p
												className={cn(
													'mt-1.5 text-[11px] leading-relaxed text-amber-700 bg-amber-50/60 border border-amber-100 rounded-sm px-2.5 py-1.5',
													LEVEL_PADDING[account.level] ?? 'pl-12'
												)}
											>
												{account.note}
											</p>
										) : null}
									</div>
								))}
							</div>
						</Card>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
					<BookOpen size={32} />
					<p className="text-sm font-medium">Nenhuma conta corresponde a &quot;{search}&quot;.</p>
				</div>
			)}
		</div>
	);
}
