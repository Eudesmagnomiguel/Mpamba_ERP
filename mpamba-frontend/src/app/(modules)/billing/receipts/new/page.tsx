'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { 
    ChevronLeft, 
    Search, 
    FileText, 
    CheckCircle2, 
    Receipt as ReceiptIcon,
    Loader2,
    Wallet,
    User,
    Calendar,
    ArrowRight,
    Trash2,
    Banknote,
    CreditCard,
    History,
    Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReceiptSchema, CreateReceiptDto } from '@/shared/dto/billing.dto';
import { useBillingInvoices, useBillingSeries, useCreateBillingReceipt, useBillingCustomers } from '@/hooks/module/billing';
import Input from '@/components/common/forms/Input';
import FormSelect from '@/components/common/forms/Select';
import Button from '@/components/common/forms/Button';
import { cn } from '@/lib/utils';


export default function NewReceiptPage() {
    const router = useRouter();
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isInvoiceDropdownOpen, setIsInvoiceDropdownOpen] = useState(false);
    const hasInitialSeriesSet = useRef(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const { data: invoicesData, isLoading: invoicesLoading } = useBillingInvoices({ 
        search: invoiceSearch, 
        status: 'ISSUED',
        limit: 10
    });
    const { data: customersData } = useBillingCustomers();
    const { data: seriesData } = useBillingSeries();
    const { mutate: createReceipt, isPending: isCreating } = useCreateBillingReceipt();

    const invoices = (invoicesData?.data || []).filter((inv: any) => inv.paymentStatus !== 'PAID');
    const series = Array.isArray(seriesData) ? seriesData.filter((s: any) => s.prefix === 'RC') : [];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<CreateReceiptDto>({
        resolver: zodResolver(CreateReceiptSchema),
        defaultValues: {
            paymentMethod: 'CASH',
            amount: 0,
            invoiceId: '',
            seriesId: '',
            reference: ''
        }
    });

    const watchAmount = watch('amount');
    const watchSeriesId = watch('seriesId');
    const watchPaymentMethod = watch('paymentMethod');

    // Auto-select first RC series
    useEffect(() => {
        if (series.length > 0 && !watchSeriesId && !hasInitialSeriesSet.current) {
            setValue('seriesId', series[0].id);
            hasInitialSeriesSet.current = true;
        }
    }, [series, watchSeriesId, setValue]);

    // Handle clicks outside search dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsInvoiceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInvoiceSelect = (invoice: any) => {
        setSelectedInvoice(invoice);
        setValue('invoiceId', invoice.id, { shouldValidate: true });
        setValue('amount', invoice.total, { shouldValidate: true });
        setIsInvoiceDropdownOpen(false);
        setInvoiceSearch('');
        toast.success(`Fatura ${invoice.number} selecionada para liquidação`);
    };

    const handleClearInvoice = () => {
        setSelectedInvoice(null);
        setValue('invoiceId', '');
        setValue('amount', 0);
    };

    const onSubmit = (data: CreateReceiptDto) => {
        if (!selectedInvoice) {
            toast.error('Por favor, selecione a fatura para liquidar');
            return;
        }

        createReceipt(data, {
            onSuccess: () => {
                toast.success('Recibo emitido com sucesso');
                router.push('/billing/receipts');
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message || err?.message || 'Erro ao criar recibo';
                toast.error(msg);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Novo Recibo</h1>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-[2px] border border-emerald-100">
                                Liquidação
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">Registo de pagamentos e liquidação de faturas</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="submit"
                        disabled={isCreating}
                        fullWidth={false}
                        className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Finalizar Recebimento
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
                {/* Left: Invoice Search & Selection */}
                <div className="flex-[7] flex flex-col gap-6 overflow-hidden">
                    {/* Search Section */}
                    <div ref={searchRef} className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm relative overflow-visible">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">1. Localizar Fatura Pendente</span>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-1 relative">
                                <div className="relative group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                    <Input 
                                        placeholder="Pesquise por Nº da Fatura ou Nome do Cliente..." 
                                        className="pl-11 h-12 font-bold border-slate-200 bg-slate-50 focus:bg-white transition-all focus:ring-emerald-500/10"
                                        value={invoiceSearch}
                                        onChange={(e) => { 
                                            setInvoiceSearch(e.target.value); 
                                            setIsInvoiceDropdownOpen(true);
                                        }}
                                        onFocus={() => {
                                            setIsInvoiceDropdownOpen(true);
                                        }}
                                    />
                                    {invoiceSearch && (
                                        <button 
                                            type="button"
                                            onClick={() => { setInvoiceSearch(''); setIsInvoiceDropdownOpen(false); }}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 font-bold text-xs"
                                        >
                                            Limpar
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown Results */}
                                {isInvoiceDropdownOpen && (
                                    <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-sm shadow-2xl max-h-[350px] overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Faturas em Aberto</span>
                                            <span className="text-[9px] font-black text-emerald-600 uppercase">{invoices.length} encontrados</span>
                                        </div>

                                        {invoicesLoading ? (
                                            <div className="p-12 text-center">
                                                <Loader2 size={24} className="animate-spin mx-auto text-emerald-500 mb-2" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Buscando faturas...</p>
                                            </div>
                                        ) : invoices.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {invoices.map((inv: any) => (
                                                    <div 
                                                        key={inv.id} 
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleInvoiceSelect(inv);
                                                        }} 
                                                        className="w-full text-left p-4 hover:bg-emerald-500/[0.02] cursor-pointer transition-all group flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-sm flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-black text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{inv.number}</span>
                                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-[2px] border uppercase bg-amber-50 text-amber-600 border-amber-100">
                                                                        Pendente
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                                    <User size={10} /> {inv.customerName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="text-sm font-black text-slate-900">{inv.total.toLocaleString()} Kz</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center justify-end gap-1">
                                                                    <Calendar size={10} /> {new Date(inv.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                                                                <ArrowRight size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-200">
                                                    <Search size={20} className="text-slate-200" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest">Nenhuma fatura em aberto</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Todas as faturas deste critério já estão liquidadas</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-[260px]">
                                <FormSelect 
                                    placeholder="Filtrar por Cliente..."
                                    className="h-12 font-bold border-slate-200 bg-slate-50"
                                    onValueChange={(val) => {
                                        if (val === 'all') {
                                            setInvoiceSearch('');
                                        } else {
                                            const c = (customersData?.data || []).find((cust: any) => cust.id === val);
                                            if (c) {
                                                setInvoiceSearch(c.name);
                                                setIsInvoiceDropdownOpen(true);
                                            }
                                        }
                                    }}
                                    options={[
                                        { value: 'all', label: 'Todos os Clientes' },
                                        ...(customersData?.data || []).map((c: any) => ({
                                            value: c.id,
                                            label: c.name
                                        }))
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Selected Invoice Detail */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedInvoice ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Selection Info Card */}
                                <div className="bg-white border-2 border-emerald-500/20 rounded-sm p-6 shadow-md flex items-start justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                                    
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className="w-16 h-16 bg-emerald-500 text-white rounded-sm flex items-center justify-center border-4 border-emerald-50 shadow-lg group-hover:scale-105 transition-transform">
                                            <ReceiptIcon size={32} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedInvoice.number}</h3>
                                                <span className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-sm">Documento a Liquidar</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-4">
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cliente / Entidade</span>
                                                    <p className="text-xs font-black text-slate-700 uppercase truncate max-w-[200px]">{selectedInvoice.customerName}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data de Emissão</span>
                                                    <p className="text-xs font-black text-slate-700 uppercase">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Documento</span>
                                                    <p className="text-xs font-black text-emerald-600 uppercase">{selectedInvoice.total.toLocaleString()} Kz</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vencimento</span>
                                                    <p className="text-xs font-black text-rose-500 uppercase">{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'Imediato'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleClearInvoice}
                                        className="h-10 px-4 flex items-center gap-2 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-sm transition-all font-black text-[10px] uppercase tracking-widest relative z-10"
                                    >
                                        <Trash2 size={14} />
                                        Alterar
                                    </button>
                                </div>

                                {/* Summary of Items (Visual only for receipts) */}
                                <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <History size={18} className="text-emerald-500" />
                                        <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Histórico do Documento</h2>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-700 uppercase">Fatura Original Emitida</p>
                                                    <p className="text-[9px] text-slate-400 font-bold">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-black text-slate-900">{selectedInvoice.total.toLocaleString()} Kz</p>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-sm border-dashed">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Banknote size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-primary uppercase">Liquidação Pendente</p>
                                                    <p className="text-[9px] text-primary/60 font-bold uppercase tracking-widest">Aguardando registo de pagamento</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-black text-primary animate-pulse">{selectedInvoice.total.toLocaleString()} Kz</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-sm border-2 border-dashed border-slate-200 animate-pulse">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-xl">
                                    <Banknote size={40} className="text-slate-200" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Nenhuma Fatura Selecionada</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase mt-3 leading-relaxed max-w-sm">
                                    Para emitir um recibo, você deve <span className="text-emerald-600 underline">localizar e selecionar</span> a fatura que deseja liquidar no campo acima.
                                </p>
                                
                                <div className="mt-10 flex items-center gap-4 opacity-50">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">1</div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Pesquisar</span>
                                    </div>
                                    <div className="w-12 h-px bg-slate-200" />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">2</div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Selecionar</span>
                                    </div>
                                    <div className="w-12 h-px bg-slate-200" />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">3</div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Liquidar</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Checkout Sidebar - White Theme */}
                <div className="flex-[3] flex flex-col min-w-[320px] max-w-[380px] bg-white border border-slate-200 rounded-sm shadow-2xl overflow-hidden animate-in slide-in-from-right-6 duration-500 relative">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full -mr-32 -mt-32 blur-3xl" />
                    </div>

                    {/* Sidebar Header */}
                    <div className="px-6 py-6 border-b border-slate-100 shrink-0 relative z-10 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-sm bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <Wallet size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Pagamento</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Configurar Recebimento</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 relative z-10 custom-scrollbar">
                        {/* Series Selection */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Série de Recibo</label>
                            <div className="relative">
                                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select 
                                    {...register('seriesId')} 
                                    className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-sm text-xs font-black text-slate-700 outline-none focus:ring-emerald-500/10 transition-all cursor-pointer"
                                >
                                    <option value="">Selecione uma série...</option>
                                    {series.map(s => (
                                        <option key={s.id} value={s.id}>{s.prefix} / {s.year}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.seriesId && <p className="text-[9px] text-rose-500 font-black uppercase">{errors.seriesId.message}</p>}
                        </div>

                        {/* Payment Method Selection */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Método de Pagamento</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setValue('paymentMethod', 'CASH')}
                                    className={cn(
                                        "p-3 rounded-sm border flex flex-col items-center gap-2 transition-all",
                                        watchPaymentMethod === 'CASH' ? "bg-white border-emerald-500 text-emerald-600 shadow-md ring-1 ring-emerald-500/20" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <Banknote size={18} />
                                    <span className="text-[8px] font-black uppercase">Numerário</span>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setValue('paymentMethod', 'MULTICAIXA')}
                                    className={cn(
                                        "p-3 rounded-sm border flex flex-col items-center gap-2 transition-all",
                                        watchPaymentMethod === 'MULTICAIXA' ? "bg-white border-emerald-500 text-emerald-600 shadow-md ring-1 ring-emerald-500/20" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <CreditCard size={18} />
                                    <span className="text-[8px] font-black uppercase">Multicaixa</span>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setValue('paymentMethod', 'TRANSFER')}
                                    className={cn(
                                        "p-3 rounded-sm border flex flex-col items-center gap-2 transition-all",
                                        watchPaymentMethod === 'TRANSFER' ? "bg-white border-emerald-500 text-emerald-600 shadow-md ring-1 ring-emerald-500/20" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <History size={18} />
                                    <span className="text-[8px] font-black uppercase">Transferência</span>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setValue('paymentMethod', 'DEPOSIT')}
                                    className={cn(
                                        "p-3 rounded-sm border flex flex-col items-center gap-2 transition-all",
                                        watchPaymentMethod === 'DEPOSIT' ? "bg-white border-emerald-500 text-emerald-600 shadow-md ring-1 ring-emerald-500/20" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <Wallet size={18} />
                                    <span className="text-[8px] font-black uppercase">Depósito</span>
                                </button>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Montante Recebido (AOA)</label>
                            <div className="relative group">
                                <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...register('amount', { valueAsNumber: true })} 
                                    className="pl-11 h-14 font-black text-xl text-slate-900 border-slate-200 bg-slate-50/50 focus:bg-white"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">AOA</span>
                            </div>
                            {errors.amount && <p className="text-[10px] text-rose-500 font-black uppercase mt-1">{errors.amount.message}</p>}
                        </div>

                        {/* Reference Input */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nº de Comprovativo / Ref.</label>
                            <div className="relative group">
                                <Info className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                <Input 
                                    {...register('reference')} 
                                    placeholder="Ex: TXN-0987654321"
                                    className="pl-11 h-12 text-xs font-bold border-slate-200 bg-slate-50/50 focus:bg-white transition-all uppercase placeholder:normal-case"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer / Summary Section */}
                    <div className="px-6 py-8 bg-slate-50/80 border-t border-slate-100 relative z-10">
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-400 uppercase tracking-widest">Saldo do Documento</span>
                                <span className="font-black text-slate-700">{selectedInvoice?.total?.toLocaleString() || '0,00'} Kz</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Total a Liquidar</span>
                                <span className="font-black text-emerald-600">{(watchAmount || 0).toLocaleString()} Kz</span>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-slate-200 rounded-sm p-5 relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
                            
                            <div className="flex items-end justify-between relative z-10">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Recebido</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className={cn(
                                            "text-3xl font-black tracking-tighter leading-none transition-all duration-500",
                                            watchAmount > 0 ? "text-emerald-600 scale-105" : "text-slate-300"
                                        )}>
                                            {(watchAmount || 0).toLocaleString()}
                                        </span>
                                        <span className="text-xs font-black text-slate-400">AOA</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-12 h-12 rounded-sm border flex items-center justify-center transition-all duration-500 shadow-inner",
                                    watchAmount > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100 scale-110" : "bg-slate-50 text-slate-300 border-slate-100"
                                )}>
                                    <CheckCircle2 size={24} />
                                </div>
                            </div>
                        </div>

                        <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-[0.3em] mt-8 opacity-50">Mpamba Treasury • Financial Integrity</p>
                    </div>
                </div>
            </div>
        </form>
    );
}
