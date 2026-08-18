'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
    Search, 
    Plus, 
    Filter, 
    Eye, 
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    ArrowRightLeft,
    Download
} from 'lucide-react';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useBillingProformas, useConvertProforma } from '@/hooks/module/billing';
import { proformaService } from '@/services/module/billing/proforma.service';
import { billingExportService } from '@/services/module/billing/export.service';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import { toast } from 'sonner';

export default function ProformasPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: proformasData, isLoading, error } = useBillingProformas({ search: searchTerm });
    const { mutate: convertProforma, isPending: isConverting } = useConvertProforma();

    const proformas = proformasData?.data || [];

    const handleConvert = (id: string) => {
        if (!confirm('Deseja converter esta proforma em uma fatura oficial?')) return;

        convertProforma({ id }, {
            onSuccess: (data: any) => {
                toast.success('Proforma convertida com sucesso!');
                router.push(`/billing/invoices`);
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message || 'Erro ao converter proforma';
                toast.error(msg);
            }
        });
    };

    const handleDownload = async (id: string, number: string) => {
        try {
            const blob = await proformaService.downloadProformaPDF(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `proforma-${number || 'rascunho'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Erro ao baixar o PDF');
        }
    };

    const handlePrint = async (id: string) => {
        try {
            const blob = await proformaService.downloadProformaPDF(id);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (err) {
            toast.error('Erro ao abrir o PDF para impressão');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONVERTED':
                return { label: 'Convertida', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 };
            case 'DRAFT':
                return { label: 'Rascunho', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock };
            case 'EXPIRED':
                return { label: 'Expirada', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: AlertCircle };
            case 'SENT':
                return { label: 'Enviada', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: FileText };
            default:
                return { label: status, color: 'bg-slate-50 text-slate-600', icon: FileText };
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Proformas e Orçamentos</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gira seus orçamentos e faturas proforma com facilidade.</p>
                </div>

                <div className="flex items-center gap-3">
                    <ExportExcelButton
                        filename="proformas"
                        label="Exportar"
                        className="px-4 py-2 bg-white border-slate-200 rounded-sm text-slate-700 font-bold text-sm hover:bg-slate-50 shadow-sm"
                        fetchFile={() => billingExportService.exportProformas({ search: searchTerm || undefined })}
                    />
                    <button 
                        onClick={() => router.push('/billing/proformas/new')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={16} />
                        Nova Proforma
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Pesquisar por número ou cliente..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-sm text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex-1 md:flex-none justify-center">
                        <Filter size={16} />
                        Filtros
                    </button>
                    <select className="bg-white border border-slate-200 rounded-sm py-2 px-4 text-sm font-bold text-slate-600 outline-none focus:border-primary transition-all cursor-pointer flex-1 md:flex-none">
                        <option>Todos os Estados</option>
                        <option>Rascunhos</option>
                        <option>Enviadas</option>
                        <option>Convertidas</option>
                    </select>
                </div>
            </div>

            {/* Proformas Table */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Valor Total</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="text-primary animate-spin" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando proformas...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-red-500 font-bold uppercase tracking-widest text-xs">
                                        Erro ao carregar orçamentos e proformas.
                                    </td>
                                </tr>
                            ) : proformas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma proforma encontrada.</p>
                                    </td>
                                </tr>
                            ) : (
                                proformas.map((pf: any) => {
                                    const badge = getStatusBadge(pf.status);
                                    const StatusIcon = badge.icon;
                                    return (
                                        <tr key={pf.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-sm flex items-center justify-center font-bold text-xs border uppercase",
                                                        pf.status === 'CONVERTED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                                    )}>
                                                        PP
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none">{pf.number || 'RASCUNHO'}</p>
                                                        <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">
                                                            {new Date(pf.date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 leading-none">{pf.customerName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase">NIF: {pf.customerNif || '999999999'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-900">
                                                    {pf.total.toLocaleString('pt-AO', { style: 'currency', currency: pf.currency })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border",
                                                    badge.color
                                                )}>
                                                    <StatusIcon size={12} />
                                                    {badge.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {pf.status !== 'CONVERTED' && (
                                                        <button 
                                                            onClick={() => handleConvert(pf.id)}
                                                            disabled={isConverting}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-sm transition-all"
                                                            title="Converter em Fatura"
                                                        >
                                                            {isConverting ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightLeft size={18} />}
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handlePrint(pf.id)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                        title="Visualizar"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownload(pf.id, pf.number)}
                                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-all"
                                                        title="Baixar PDF"
                                                    >
                                                        <Download size={18} />
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

                {/* Table Footer / Pagination */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Total: {proformasData?.meta?.total || proformas.length} documentos
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-sm text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all">Anterior</button>
                        <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-sm text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Próximo</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
