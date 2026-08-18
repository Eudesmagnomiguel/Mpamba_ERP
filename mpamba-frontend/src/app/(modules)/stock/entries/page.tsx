'use client';

import React, { useState } from 'react';
import { 
    Search, 
    Filter, 
    ArrowDownCircle, 
    User,
    MoreVertical,
    ExternalLink,
    FileText,
    Plus,
    Loader2,
    AlertCircle
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
import { useStockMovements } from '@/hooks/module/stock';
import Link from 'next/link';
import EntryModal from '@/components/stock/EntryModal';

import { useHasPermission } from '@/hooks/core/usePermission';

export default function EntriesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const canCreateEntry = useHasPermission('stock:entry:create');
    
    // API Hook filtered by ENTRADA
    const { data: entriesData, isLoading, error } = useStockMovements({ 
        type: 'ENTRADA' 
    });
    
    const entries = entriesData?.data || [];
    const pagination = entriesData?.pagination;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Entradas de Stock</h1>
                    <p className="text-slate-500 text-sm mt-1">Gira e visualize todos os recebimentos de mercadoria.</p>
                </div>
                {canCreateEntry && (
                    <Button 
                        onClick={() => setIsEntryModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 gap-2 h-11 px-6 rounded-sm"
                    >
                        <Plus size={18} />
                        Nova Entrada
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm rounded-sm">
                <CardContent className="px-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                            placeholder="Pesquisar por produto ou referência..." 
                            className="pl-10 h-11 bg-white border-slate-200 rounded-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-11 border-slate-200 text-slate-600 gap-2 rounded-sm">
                        <Filter size={18} />
                        Filtrar Data
                    </Button>
                </CardContent>
            </Card>

            {/* Entries Table */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Qtd.</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referência</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registado por</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="text-emerald-600 animate-spin" />
                                            <p className="text-sm font-medium text-slate-500">Carregando entradas...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-rose-500">
                                        <AlertCircle size={32} className="mx-auto" />
                                        <p className="text-sm font-medium mt-2">Erro ao carregar entradas.</p>
                                    </td>
                                </tr>
                            ) : entries.length > 0 ? (
                                entries.map((ent) => (
                                    <tr key={ent.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <div className="font-medium text-slate-900">
                                                {new Date(ent.createdAt).toLocaleDateString('pt-AO')}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">
                                                {new Date(ent.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                    <ArrowDownCircle size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">{ent.product?.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-500">{ent.product?.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-bold text-emerald-600">
                                                +{ent.quantity}
                                            </span>
                                            <span className="ml-1 text-[10px] text-slate-400 font-medium uppercase">{ent.product?.unit}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-700 font-medium">{ent.reference || '---'}</div>
                                            <div className="text-[10px] text-slate-400 truncate max-w-[150px] italic">{ent.reason}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-sm bg-slate-200 flex items-center justify-center text-slate-500">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-xs text-slate-600 font-medium">{ent.user?.name}</span>
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
                                                        <Link href={`/stock/products/${ent.productId}`} className="flex items-center gap-2 cursor-pointer focus:bg-slate-50 rounded-sm">
                                                            <ExternalLink size={14} />
                                                            Ver Produto
                                                        </Link>
                                                    </DropdownMenuItem>
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
                                            <div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center text-slate-300">
                                                <ArrowDownCircle size={24} />
                                            </div>
                                            <div className="text-slate-500 font-medium">Nenhuma entrada encontrada</div>
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
                            Total de <span className="text-slate-900 font-bold">{pagination.total}</span> entradas
                        </div>
                    </div>
                )}
            </div>

            <EntryModal 
                isOpen={isEntryModalOpen} 
                onClose={() => setIsEntryModalOpen(false)} 
            />
        </div>
    );
}
