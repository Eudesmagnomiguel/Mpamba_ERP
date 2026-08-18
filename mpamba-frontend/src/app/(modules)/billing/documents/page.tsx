'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    FileText,
    Layers3,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    Receipt,
    ArrowRight,
    FileCheck2,
    Loader,
    Undo2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import { cn } from '@/lib/utils';
import { useBilling } from '@/hooks/module/billing';
import SeriesModal from './components/SeriesModal';

const documentSeriesMap: Record<string, { name: string; description: string; path: string }> = {
    FT: { name: 'Faturas', description: 'Documentos principais de venda', path: '/billing/invoices' },
    RC: { name: 'Recibos', description: 'Liquidações e pagamentos recebidos', path: '/billing/receipts' },
    PF: { name: 'Proformas', description: 'Documentos preliminares e orçamentos', path: '/billing/proformas' },
    NC: { name: 'Notas de Crédito', description: 'Ajustes e anulações fiscais', path: '/billing/credit-notes' },
};

function statusStyle(status: string | boolean) {
    const statusStr = typeof status === 'boolean' ? (status ? 'ACTIVE' : 'DRAFT') : status;
    switch (statusStr) {
        case 'ACTIVE':
        case 'true':
            return { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 };
        case 'DRAFT':
        case 'false':
            return { label: 'Rascunho', className: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock };
        default:
            return { label: statusStr, className: 'bg-slate-50 text-slate-600 border-slate-200', icon: FileText };
    }
}

export default function BillingDocumentsPage() {
    const router = useRouter();
    const { getSeries, getInvoices, getReceipts, getProformas, getCreditNotes } = useBilling();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [selectedSeries, setSelectedSeries] = React.useState<any>(null);

    // Fetch all data
    const { data: seriesData, isLoading: seriesLoading } = useQuery({
        queryKey: ['billing', 'series'],
        queryFn: () => getSeries(),
    });

    const { data: invoicesData } = useQuery({
        queryKey: ['billing', 'invoices'],
        queryFn: () => getInvoices({ limit: 1000 }),
    });

    const { data: receiptsData } = useQuery({
        queryKey: ['billing', 'receipts'],
        queryFn: () => getReceipts({ limit: 1000 }),
    });

    const { data: proformasData } = useQuery({
        queryKey: ['billing', 'proformas'],
        queryFn: () => getProformas({ limit: 1000 }),
    });

    const { data: creditNotesData } = useQuery({
        queryKey: ['billing', 'creditNotes'],
        queryFn: () => getCreditNotes({ limit: 1000 }),
    });

    const stats = [
        { 
            label: 'Faturas', 
            value: (invoicesData as any)?.meta?.total || 0, 
            icon: FileText, 
            tone: 'blue', 
            path: '/billing/invoices' 
        },
        { 
            label: 'Recibos', 
            value: (receiptsData as any)?.meta?.total || 0, 
            icon: Receipt, 
            tone: 'emerald', 
            path: '/billing/receipts' 
        },
        { 
            label: 'Proformas', 
            value: (proformasData as any)?.meta?.total || 0, 
            icon: FileCheck2, 
            tone: 'amber', 
            path: '/billing/proformas' 
        },
        { 
            label: 'Notas de Crédito', 
            value: (creditNotesData as any)?.meta?.total || 0, 
            icon: Undo2, 
            tone: 'rose', 
            path: '/billing/credit-notes' 
        },
    ];

    const filteredSeries = (seriesData as any[])?.filter(
        (s: any) => !searchTerm || s.prefix.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleEditSeries = (series: any) => {
        setSelectedSeries(series);
        setIsModalOpen(true);
    };

    const handleCreateSeries = () => {
        setSelectedSeries(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documentos Fiscais</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gira as séries, prefixos e fluxos de documentos de faturação.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleCreateSeries}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={16} />
                        Nova Série
                    </button>
                </div>
            </div>

            {/* Document Types Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    const toneClasses = {
                        blue: 'border-blue-100 hover:border-blue-300 group hover:shadow-blue-500/5',
                        emerald: 'border-emerald-100 hover:border-emerald-300 group hover:shadow-emerald-500/5',
                        amber: 'border-amber-100 hover:border-amber-300 group hover:shadow-amber-500/5',
                        rose: 'border-rose-100 hover:border-rose-300 group hover:shadow-rose-500/5',
                    }[stat.tone];

                    const iconColorClasses = {
                        blue: 'bg-blue-50 text-blue-600',
                        emerald: 'bg-emerald-50 text-emerald-600',
                        amber: 'bg-amber-50 text-amber-600',
                        rose: 'bg-rose-50 text-rose-600',
                    }[stat.tone];

                    return (
                        <div 
                            key={idx} 
                            onClick={() => router.push(stat.path)}
                            className={cn(
                                "bg-white border p-5 rounded-sm cursor-pointer transition-all active:scale-95 shadow-sm",
                                toneClasses
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className={cn("p-2 rounded-sm", iconColorClasses)}>
                                    <Icon size={18} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                                <div>
                                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{stat.value}</p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-tight flex items-center gap-1">
                                        Ver documentos <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Series Table */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                <div className="px-6 py-4 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Layers3 size={14} />
                        Séries Ativas e Configurações
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Pesquisar série..."
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-sm text-xs font-medium focus:ring-1 focus:ring-primary outline-none transition-all w-48"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Código / Prefixo</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tipo Documento</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Sequência</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {seriesLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader className="animate-spin text-primary" size={32} />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando séries...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSeries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma série encontrada.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSeries.map((series: any) => {
                                    const seriesInfo = documentSeriesMap[series.prefix] || { 
                                        name: series.prefix, 
                                        description: 'Série de documentos',
                                        path: '#'
                                    };
                                    const badge = statusStyle(series.isActive);
                                    const StatusIcon = badge.icon;

                                    return (
                                        <tr key={series.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-sm bg-slate-50 border border-slate-100 flex items-center justify-center font-mono text-xs font-black text-slate-400 uppercase tracking-tighter">
                                                        {series.prefix}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none">{series.prefix} {series.year}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">Série Fiscal {series.year}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 leading-none">{seriesInfo.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase truncate max-w-[200px]">{seriesInfo.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-black text-slate-900">{String(series.nextSequence - 1).padStart(4, '0')}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Próximo: {series.nextSequence}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={cn(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider',
                                                    badge.className
                                                )}>
                                                    <StatusIcon size={12} />
                                                    {badge.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button 
                                                        onClick={() => handleEditSeries(series)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                        title="Editar Série"
                                                    >
                                                        <Plus size={18} className="rotate-45" />
                                                    </button>
                                                    <button 
                                                        onClick={() => router.push(seriesInfo.path)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                        title="Ver Documentos"
                                                    >
                                                        <ArrowRight size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Total: {filteredSeries.length} séries configuradas no sistema
                    </p>
                </div>
            </div>

            <SeriesModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                series={selectedSeries}
            />
        </div>
    );
}