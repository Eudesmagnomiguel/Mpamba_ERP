'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
    Search, 
    Plus, 
    Filter, 
    Eye, 
    Download, 
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2
} from 'lucide-react';
import Button from '@/components/common/forms/Button';

import Input from '@/components/common/forms/Input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useBillingInvoices, useIssueBillingInvoice, useMarkInvoicePaymentStatus } from '@/hooks/module/billing';
import billingService, { billingExportService } from '@/services/module/billing';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InvoicesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: invoicesData, isLoading, error } = useBillingInvoices({ search: searchTerm });
    const { mutate: issueInvoice, isPending: isIssuing } = useIssueBillingInvoice();
    const { mutate: markPaymentStatus } = useMarkInvoicePaymentStatus();

    const invoices = invoicesData?.data || [];

    const handleIssue = (id: string) => {
        if (!confirm('Deseja emitir esta fatura oficialmente? Esta ação é irreversível.')) return;

        issueInvoice(id, {
            onSuccess: () => {
                toast.success('Fatura emitida com sucesso!');
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message || 'Erro ao emitir fatura';
                toast.error(msg);
            }
        });
    };

    const handleDownload = async (id: string, number: string) => {
        try {
            const blob = await billingService.downloadInvoicePDF(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fatura-${number || 'rascunho'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Erro ao baixar o PDF');
        }
    };

    const handlePrint = async (id: string) => {
        try {
            const blob = await billingService.downloadInvoicePDF(id);
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

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'PAGO':
                return { label: 'Pago', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
            case 'PARCIAL':
                return { label: 'Parcial', color: 'bg-amber-100 text-amber-700 border-amber-200' };
            case 'VENCIDO':
                return { label: 'Vencido', color: 'bg-rose-100 text-rose-700 border-rose-200' };
            case 'PENDENTE':
                return { label: 'Pendente', color: 'bg-slate-100 text-slate-600 border-slate-200' };
            default:
                return { label: status, color: 'bg-slate-50 text-slate-500' };
        }
    };

    const handleMarkStatus = (id: string, status: any) => {
        markPaymentStatus({ id, data: { status } }, {
            onSuccess: () => toast.success(`Estado de pagamento atualizado para ${status}`),
            onError: () => toast.error('Erro ao atualizar estado de pagamento')
        });
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faturas e Documentos</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gerencie seus documentos comerciais com precisão e conformidade legal.</p>
                </div>

                <div className="flex items-center gap-3">
                    <ExportExcelButton
                        filename="faturas"
                        label="Exportar"
                        className="px-4 py-2 bg-white border-slate-200 rounded-sm text-slate-700 font-bold text-sm hover:bg-slate-50 shadow-sm"
                        fetchFile={() => billingExportService.exportInvoices({ search: searchTerm || undefined })}
                    />
                    <button 
                        onClick={() => router.push('/billing/invoices/new')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={16} />
                        Nova Fatura
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
                        placeholder="Pesquisar por número, cliente ou NIF..." 
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
                        <option>Canceladas</option>
                    </select>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Valor Total</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Pagamento</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="text-primary animate-spin" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando faturas...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-red-500 font-bold uppercase tracking-widest text-xs">
                                        Erro ao carregar documentos financeiros.
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum documento encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv: any) => {
                                    const badge = getStatusBadge(inv.status);
                                    const StatusIcon = badge.icon;
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-sm flex items-center justify-center font-bold text-xs border uppercase",
                                                        inv.status === 'ISSUED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                                    )}>
                                                        {inv.number ? inv.number.split('-')[0] : 'FT'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none">{inv.number || 'RASCUNHO'}</p>
                                                        <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">
                                                            {format(new Date(inv.date), 'dd MMM yyyy', { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 leading-none">{inv.customerName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase">NIF: {inv.customerNif || '999999999'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-900">
                                                    {inv.total.toLocaleString('pt-AO', { style: 'currency', currency: inv.currency })}
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
                                            <td className="px-6 py-4 text-center">
                                                {inv.status === 'ISSUED' ? (
                                                    <select 
                                                        value={inv.paymentStatus}
                                                        onChange={(e) => handleMarkStatus(inv.id, e.target.value)}
                                                        className={cn(
                                                            "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm border outline-none cursor-pointer transition-all",
                                                            getPaymentStatusBadge(inv.paymentStatus).color
                                                        )}
                                                    >
                                                        <option value="PENDENTE">Pendente</option>
                                                        <option value="PAGO">Pago</option>
                                                        <option value="PARCIAL">Parcial</option>
                                                        <option value="VENCIDO">Vencido</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {inv.status === 'DRAFT' && (
                                                        <button 
                                                            onClick={() => handleIssue(inv.id)}
                                                            disabled={isIssuing}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-sm transition-all"
                                                            title="Emitir Fatura"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handlePrint(inv.id)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                        title="Visualizar"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownload(inv.id, inv.number)}
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
                        Total: {invoicesData?.meta?.total || invoices.length} documentos
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
