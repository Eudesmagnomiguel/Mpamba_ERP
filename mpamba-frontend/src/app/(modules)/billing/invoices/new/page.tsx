'use client';

import { useRouter } from 'next/navigation';
import {
    Search,
    Plus,
    Trash2,
    ChevronLeft,
    Package,
    ShoppingCart,
    FileText,
    Info,
    Minus,
    Loader2,
    UserCircle2,
    Wallet,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useState, useMemo, useEffect, useRef } from 'react';
import Input from '@/components/common/forms/Input';
import FormSelect from '@/components/common/forms/Select';
import { useStockProducts } from '@/hooks/module/stock';
import Button from '@/components/common/forms/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { CreateInvoiceSchema, CreateInvoiceDto } from '@/shared/dto/billing.dto';
import { useBillingCustomers, useBillingSeries, useCreateBillingInvoice, useBillingServices } from '@/hooks/module/billing';

export default function NewInvoicePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { mutate: createInvoice, isPending: isCreating } = useCreateBillingInvoice();

    const isStockActive = user?.modules?.includes('stock');

    const [activeTab, setActiveTab] = useState<'services' | 'products'>(isStockActive ? 'products' : 'services');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const hasInitialSeriesSet = useRef(false);

    const { data: customersData } = useBillingCustomers();
    const { data: seriesData } = useBillingSeries();
    const { data: productsData } = useStockProducts({ search: catalogSearch }, { enabled: isStockActive });
    const { data: servicesData } = useBillingServices({ search: catalogSearch });

    const customers = customersData?.data || [];
    const series = Array.isArray(seriesData) ? seriesData : [];
    const products = productsData?.data || [];
    const services = servicesData?.data || [];

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<CreateInvoiceDto>({
        resolver: zodResolver(CreateInvoiceSchema),
        defaultValues: {
            seriesId: '',
            customerId: null,
            customerName: '',
            customerNif: '',
            customerAddress: '',
            currency: 'AOA',
            items: []
        }
    });

    const { fields, append, remove, update } = useFieldArray({ control, name: 'items' });
    const items = watch('items') || [];
    const watchSeriesId = watch('seriesId');

    useEffect(() => {
        if (series.length > 0 && !watchSeriesId && !hasInitialSeriesSet.current) {
            setValue('seriesId', series[0].id);
            hasInitialSeriesSet.current = true;
        }
    }, [series, watchSeriesId, setValue]);

    useEffect(() => {
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
            const firstError: any = errors[errorKeys[0] as keyof typeof errors];
            if (firstError?.message) {
                toast.error(firstError.message);
            } else if (errorKeys[0] === 'items' && (errors as any).items?.message) {
                toast.error((errors as any).items.message);
            }
        }
    }, [errors]);

    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            const subtotal = item.quantity * item.unitPrice;
            const discountAmount = item.discount || 0;
            const taxBase = subtotal - discountAmount;
            const taxAmount = taxBase * ((item.taxRate || 0) / 100);
            return {
                subtotal: acc.subtotal + subtotal,
                tax: acc.tax + taxAmount,
                discount: acc.discount + discountAmount,
                total: acc.total + (taxBase + taxAmount)
            };
        }, { subtotal: 0, tax: 0, discount: 0, total: 0 });
    }, [items]);

    const handleCustomerSelect = (customer: any) => {
        setSelectedCustomer(customer);
        setValue('customerId', customer.id, { shouldValidate: true, shouldDirty: true });
        setValue('customerName', customer.name, { shouldValidate: true, shouldDirty: true });
        setValue('customerNif', customer.nif || '', { shouldValidate: true, shouldDirty: true });
        setValue('customerAddress', customer.address || '', { shouldValidate: true, shouldDirty: true });
    };

    const handleClearCustomer = () => {
        setSelectedCustomer(null);
        setValue('customerId', null, { shouldValidate: true, shouldDirty: true });
        setValue('customerName', '', { shouldValidate: true, shouldDirty: true });
        setValue('customerNif', '', { shouldValidate: true, shouldDirty: true });
        setValue('customerAddress', '', { shouldValidate: true, shouldDirty: true });
    };

    const handleAddItem = (type: 'product' | 'service', data: any) => {
        const existingIndex = items.findIndex(item =>
            (type === 'product' && item.productId === data.id) ||
            (type === 'service' && item.serviceId === data.id)
        );
        if (existingIndex > -1) {
            const current = items[existingIndex];
            update(existingIndex, { ...current, quantity: current.quantity + 1 });
        } else {
            append({
                productId: type === 'product' ? data.id : null,
                serviceId: type === 'service' ? data.id : null,
                description: data.name,
                quantity: 1,
                unitPrice: data.price || 0,
                taxRate: data.taxRate || 14,
                discount: 0
            });
        }
    };

    const handleQtyChange = (index: number, delta: number) => {
        const current = items[index];
        const newQty = Math.max(1, (current.quantity || 1) + delta);
        update(index, { ...current, quantity: newQty });
    };

    const onSubmit = (data: CreateInvoiceDto) => {
        if (!selectedCustomer) {
            toast.error('Por favor, selecione um cliente válido para emitir a fatura');
            return;
        }
        if (items.length === 0) {
            toast.error('Adicione pelo menos um item à fatura');
            return;
        }
        if (!data.seriesId) {
            toast.error('Selecione uma série de faturação');
            return;
        }

        createInvoice(data, {
            onSuccess: () => {
                toast.success('Fatura criada com sucesso');
                router.push('/billing/invoices');
            },
            onError: (err: any) => {
                const errorData = err?.response?.data;
                const msg = errorData?.message || errorData?.error || err?.message || 'Erro ao criar fatura';
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
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Nova Fatura</h1>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-[2px] border border-primary/10">
                                Oficial
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Venda de produtos e prestação de serviços</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {series.length > 0 && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-sm px-3 h-11 shadow-sm">
                            <FileText size={16} className="text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter -mb-1">Série Fiscal</span>
                                <select
                                    {...register('seriesId')}
                                    className="text-xs font-black text-slate-700 bg-transparent border-none outline-none cursor-pointer p-0"
                                >
                                    {series.map(s => (
                                        <option key={s.id} value={s.id}>{s.prefix} / {s.year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    <Button
                        type="submit"
                        disabled={isCreating}
                        fullWidth={false}
                        className="h-11 px-8 bg-primary hover:bg-primary-hover text-white rounded-sm text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={16} />
                                Emitir Fatura
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
                {/* Left: Product/Service Catalog */}
                <div className="flex-[7] flex flex-col gap-6 overflow-hidden">
                    {/* Customer Info Card */}
                    <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <UserCircle2 size={120} className="text-primary" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecione o Cliente</span>
                                </div>
                                {selectedCustomer && (
                                    <button 
                                        type="button"
                                        onClick={handleClearCustomer}
                                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                        Mudar Cliente
                                    </button>
                                )}
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="flex-1">
                                    <FormSelect 
                                        placeholder="Escolha um cliente da lista..."
                                        className="h-12 font-bold border-slate-200 text-slate-900 focus:ring-primary/20"
                                        onValueChange={(val) => {
                                            const c = customers.find((cust: any) => cust.id === val);
                                            if (c) handleCustomerSelect(c);
                                        }}
                                        value={selectedCustomer?.id || ''}
                                        options={[
                                            ...customers.map((c: any) => ({
                                                value: c.id,
                                                label: `${c.name} — ${c.nif || 'Sem NIF'}`
                                            }))
                                        ]}
                                    />
                                    {!selectedCustomer && (
                                        <div className="mt-2 flex items-center gap-2 text-rose-500 animate-pulse">
                                            <AlertCircle size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Atenção: Seleção obrigatória</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-[0.6] flex flex-col gap-3">
                                    <div className={cn(
                                        "flex items-center gap-4 px-4 py-3 border rounded-sm transition-all",
                                        selectedCustomer ? "bg-primary/5 border-primary/10" : "bg-slate-50 border-slate-100"
                                    )}>
                                        <div className={cn("shrink-0", selectedCustomer ? "text-primary" : "text-slate-400")}>
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NIF Contribuinte</span>
                                            <span className="text-xs font-black text-slate-700">{selectedCustomer?.nif || '--- --- ---'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Catalog Controls */}
                    <div className="flex flex-col gap-4 overflow-hidden">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200/50">
                                {isStockActive && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('products')}
                                        className={cn(
                                            "h-9 px-6 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
                                            activeTab === 'products'
                                                ? "bg-white text-primary shadow-sm border border-slate-200"
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Produtos
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('services')}
                                    className={cn(
                                        "h-9 px-6 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTab === 'services'
                                            ? "bg-white text-primary shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Serviços
                                </button>
                            </div>

                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input
                                    placeholder="Procurar no catálogo de vendas..."
                                    className="pl-11 h-11 text-xs font-bold border-slate-200 rounded-sm bg-white shadow-sm focus:ring-primary/10"
                                    value={catalogSearch}
                                    onChange={(e) => setCatalogSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Catalog Items Grid */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                                {activeTab === 'products' ? (
                                    products.length > 0 ? products.map((p: any) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleAddItem('product', p)}
                                            className="group bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 rounded-sm p-4 text-left transition-all relative overflow-hidden"
                                        >
                                            <div className="w-10 h-10 bg-slate-50 rounded-sm flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all mb-4">
                                                <Package size={20} />
                                            </div>
                                            <h4 className="text-[11px] font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[32px] leading-tight mb-4 uppercase tracking-tight">
                                                {p.name}
                                            </h4>
                                            <div className="flex items-end justify-between border-t border-slate-50 pt-3">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Preço Base</span>
                                                    <p className="text-sm font-black text-slate-900">
                                                        {(p.price || 0).toLocaleString()} <span className="text-[9px] font-bold text-slate-400 ml-0.5">Kz</span>
                                                    </p>
                                                </div>
                                                <div className={cn(
                                                    "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter border",
                                                    p.currentQuantity > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
                                                )}>
                                                    {p.currentQuantity} {p.unit}
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-5 h-5 bg-primary text-white rounded-sm flex items-center justify-center shadow-lg">
                                                    <Plus size={12} />
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50/50 rounded-sm border border-dashed border-slate-200">
                                            <Package size={48} className="text-slate-200 mb-4" />
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum produto em stock</p>
                                        </div>
                                    )
                                ) : (
                                    services.length > 0 ? services.map((s: any) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => handleAddItem('service', s)}
                                            className="group bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 rounded-sm p-4 text-left transition-all relative overflow-hidden"
                                        >
                                            <div className="w-10 h-10 bg-slate-50 rounded-sm flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all mb-4">
                                                <Info size={20} />
                                            </div>
                                            <h4 className="text-[11px] font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[32px] leading-tight mb-4 uppercase tracking-tight">
                                                {s.name}
                                            </h4>
                                            <div className="flex items-end justify-between border-t border-slate-50 pt-3">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Taxa Fixa</span>
                                                    <p className="text-sm font-black text-slate-900">
                                                        {(s.price || 0).toLocaleString()} <span className="text-[9px] font-bold text-slate-400 ml-0.5">Kz</span>
                                                    </p>
                                                </div>
                                                <div className="px-2 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded-sm text-[9px] font-black uppercase tracking-tighter">
                                                    IVA {s.taxRate}%
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-5 h-5 bg-primary text-white rounded-sm flex items-center justify-center shadow-lg">
                                                    <Plus size={12} />
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50/50 rounded-sm border border-dashed border-slate-200">
                                            <Info size={48} className="text-slate-200 mb-4" />
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Catálogo de serviços vazio</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Checkout Sidebar - Updated to White Theme */}
                <div className="flex-[3] flex flex-col min-w-[320px] max-w-[380px] bg-white border border-slate-200 rounded-sm shadow-xl overflow-hidden animate-in slide-in-from-right-6 duration-500 relative">
                    {/* Subtle abstract background pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full -mr-32 -mt-32 blur-3xl" />
                    </div>

                    {/* Cart Header */}
                    <div className="px-6 py-5 border-b border-slate-100 shrink-0 relative z-10 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/5">
                                    <ShoppingCart size={18} className="text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Checkout</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">{items.length} Itens no carrinho</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cart List */}
                    <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar relative z-10">
                        {fields.length > 0 ? fields.map((field, index) => {
                            const item = items[index];
                            const lineTotal = (item?.quantity || 1) * (item?.unitPrice || 0);
                            return (
                                <div key={field.id} className="mx-3 mb-4 last:mb-0 group animate-in fade-in zoom-in-95 duration-300">
                                    <div className="bg-slate-50/50 hover:bg-white hover:shadow-md border border-slate-100 hover:border-primary/20 rounded-sm p-3.5 transition-all">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">
                                                    {item?.description || '—'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-sm transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 bg-white rounded-[3px] p-0.5 border border-slate-200 shadow-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQtyChange(index, -1)}
                                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-colors"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="w-9 text-center text-xs font-black text-slate-900 tracking-widest">
                                                    {item?.quantity || 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQtyChange(index, 1)}
                                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-colors"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total</p>
                                                <p className="text-sm font-black text-primary tracking-tight">
                                                    {lineTotal.toLocaleString()} <span className="text-[9px] text-slate-400 ml-0.5 uppercase">Kz</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <input type="hidden" {...register(`items.${index}.description` as const)} />
                                    <input type="hidden" {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })} />
                                    <input type="hidden" {...register(`items.${index}.taxRate` as const, { valueAsNumber: true })} />
                                    <input type="hidden" {...register(`items.${index}.discount` as const, { valueAsNumber: true })} />
                                    <input type="hidden" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} />
                                </div>
                            );
                        }) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                    <ShoppingCart size={32} className="text-slate-200" />
                                </div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Carrinho Vazio</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase mt-2 leading-relaxed">Selecione itens do catálogo para iniciar o faturamento</p>
                            </div>
                        )}
                    </div>

                    {/* Footer / Summary Section - Light Theme */}
                    <div className="px-6 py-6 bg-slate-50/80 border-t border-slate-100 relative z-10">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-400 uppercase tracking-widest">Subtotal Bruto</span>
                                <span className="font-black text-slate-700">{totals.subtotal.toLocaleString()} Kz</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-400 uppercase tracking-widest">Impostos (IVA)</span>
                                <span className="font-black text-slate-700">{totals.tax.toLocaleString()} Kz</span>
                            </div>
                            {totals.discount > 0 && (
                                <div className="flex justify-between items-center text-[11px] text-rose-500">
                                    <span className="font-bold uppercase tracking-widest">Descontos Aplicados</span>
                                    <span className="font-black">-{totals.discount.toLocaleString()} Kz</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white border border-slate-200 rounded-sm p-4 relative overflow-hidden group shadow-inner">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                            
                            <div className="flex items-end justify-between relative z-10">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor Final</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-primary tracking-tight leading-none">
                                            {totals.total.toLocaleString()}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">AOA</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-primary/10 rounded-sm border border-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Wallet size={20} />
                                </div>
                            </div>
                        </div>

                        <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-[0.2em] mt-6">Mpamba Billing System • 100% Digital</p>
                    </div>
                </div>
            </div>
        </form>
    );
}
