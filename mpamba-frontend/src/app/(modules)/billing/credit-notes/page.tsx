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
    Undo2,
    Download
} from 'lucide-react';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useBillingCreditNotes, useIssueCreditNote } from '@/hooks/module/billing';
import { creditNoteService } from '@/services/module/billing/credit-note.service';
import { billingExportService } from '@/services/module/billing/export.service';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import { toast } from 'sonner';

export default function CreditNotesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: creditNotesData, isLoading, error } = useBillingCreditNotes({ search: searchTerm });
    const { mutate: issueCreditNote, isPending: isIssuing } = useIssueCreditNote();

    const creditNotes = creditNotesData?.data || [];

    const handleIssue = (id: string) => {
        if (!confirm('Deseja emitir esta nota de crédito oficialmente? Esta ação é irreversível.')) return;

        issueCreditNote(id, {
            onSuccess: () => {
                toast.success('Nota de crédito emitida com sucesso!');
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message || 'Erro ao emitir nota de crédito';
                toast.error(msg);
            }
        });
    };

    const handleDownload = async (id: string, number: string) => {
        try {
            const blob = await creditNoteService.downloadCreditNotePDF(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `nota-credito-${number || 'rascunho'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Erro ao baixar o PDF');
        }
    };

    const handlePrint = async (id: string) => {
        try {
            const blob = await creditNoteService.downloadCreditNotePDF(id);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (err) {
            toast.error('Erro ao abrir o PDF para impressão');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ISSUED':
                return { label: 'Emitido', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 };
            case 'DRAFT':
                return { label: 'Rascunho', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock };
            case 'CANCELLED':
                return { label: 'Cancelado', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: AlertCircle };
            default:
                return { label: status, color: 'bg-slate-50 text-slate-600', icon: FileText };
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notas de Crédito</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gira as anulações e retificações de faturas emitidas.</p>
                </div>

                <div className="flex items-center gap-3">
                    <ExportExcelButton
                        filename="notas-de-credito"
                        label="Exportar"
                        className="px-4 py-2 bg-white border-slate-200 rounded-sm text-slate-700 font-bold text-sm hover:bg-slate-50 shadow-sm"
                        fetchFile={() => billingExportService.exportCreditNotes({ search: searchTerm || undefined })}
                    />
                    <button 
                        onClick={() => router.push('/billing/credit-notes/new')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={16} />
                        Nova Nota de Crédito
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
                        placeholder="Pesquisar por número ou motivo..." 
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
                        <option>Emitidas</option>
                        <option>Rascunhos</option>
                    </select>
                </div>
            </div>

            {/* Credit Notes Table */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fatura Original</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Valor Retificado</th>
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
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando notas de crédito...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-red-500 font-bold uppercase tracking-widest text-xs">
                                        Erro ao carregar histórico de notas de crédito.
                                    </td>
                                </tr>
                            ) : creditNotes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma nota de crédito encontrada.</p>
                                    </td>
                                </tr>
                            ) : (
                                creditNotes.map((nc: any) => {
                                    const badge = getStatusBadge(nc.status);
                                    const StatusIcon = badge.icon;
                                    return (
                                        <tr key={nc.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-sm flex items-center justify-center font-bold text-xs border uppercase",
                                                        nc.status === 'ISSUED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                                    )}>
                                                        NC
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none">{nc.number || 'RASCUNHO'}</p>
                                                        <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">
                                                            {new Date(nc.date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 leading-none">{nc.invoice?.number || 'Fatura #'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase truncate max-w-[180px]">{nc.reason || 'Sem motivo especificado'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-rose-600">
                                                    -{nc.amount.toLocaleString('pt-AO', { style: 'currency', currency: nc.invoice?.currency || 'AOA' })}
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
                                                    {nc.status === 'DRAFT' && (
                                                        <button 
                                                            onClick={() => handleIssue(nc.id)}
                                                            disabled={isIssuing}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-sm transition-all"
                                                            title="Emitir Nota de Crédito"
                                                        >
                                                            {isIssuing ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />}
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handlePrint(nc.id)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                        title="Visualizar"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownload(nc.id, nc.number)}
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
                        Total: {creditNotesData?.meta?.total || creditNotes.length} documentos
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
