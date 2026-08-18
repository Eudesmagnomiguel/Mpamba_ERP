'use client';

import { useMemo, useState } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Delete,
    Banknote,
    CreditCard,
    Landmark,
    Wallet,
    Loader2,
    CheckCircle2,
    Package,
    ReceiptText,
    X,
    Printer,
    FileText,
    Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useStockProducts } from '@/hooks/module/stock/useProducts';
import { useBillingCustomers } from '@/hooks/module/billing/useCustomers';
import { usePosCheckout } from '@/hooks/module/billing/usePos';
import { PosPaymentMethod, PosCheckoutResult } from '@/shared/dto/pos.dto';
import { invoiceService } from '@/services/module/billing/invoice.service';
import { receiptService } from '@/services/module/billing/receipt.service';

interface CartLine {
    productId: string;
    name: string;
    unit: string;
    unitPrice: number;
    availableQuantity: number;
    quantity: number;
}

const TAX_RATE = 0.14;

const PAYMENT_METHODS: { value: PosPaymentMethod; label: string; icon: typeof Banknote }[] = [
    { value: 'CASH', label: 'Numerário', icon: Banknote },
    { value: 'MULTICAIXA', label: 'Multicaixa', icon: CreditCard },
    { value: 'TRANSFER', label: 'Transferência', icon: Landmark },
    { value: 'DEPOSIT', label: 'Depósito', icon: Wallet },
];

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

export default function PosPage() {
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartLine[]>([]);
    const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('CASH');
    const [customerId, setCustomerId] = useState<string>('');
    const [lastSale, setLastSale] = useState<PosCheckoutResult | null>(null);
    const [isOpeningDocument, setIsOpeningDocument] = useState(false);
    const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL'>(() => {
        if (typeof window === 'undefined') return 'A4';
        return localStorage.getItem('pos-print-format') === 'THERMAL' ? 'THERMAL' : 'A4';
    });

    const updatePrintFormat = (format: 'A4' | 'THERMAL') => {
        setPrintFormat(format);
        if (typeof window !== 'undefined') localStorage.setItem('pos-print-format', format);
    };

    const { data: productsData, isLoading: isProductsLoading } = useStockProducts({ search, pageSize: 60 });
    const { data: customersData } = useBillingCustomers({ pageSize: 100 });
    const checkoutMutation = usePosCheckout();

    const products = (productsData?.data || []).filter((p) => p.isActive);
    const customers = customersData?.data || [];

    const addToCart = (product: (typeof products)[number]) => {
        if (product.currentQuantity <= 0) {
            toast.error('Produto sem stock disponível.');
            return;
        }
        setCart((prev) => {
            const existing = prev.find((l) => l.productId === product.id);
            if (existing) {
                if (existing.quantity + 1 > product.currentQuantity) {
                    toast.error('Quantidade excede o stock disponível.');
                    return prev;
                }
                setSelectedLineId(product.id);
                return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
            }
            setSelectedLineId(product.id);
            return [
                ...prev,
                {
                    productId: product.id,
                    name: product.name,
                    unit: product.unit,
                    unitPrice: product.price || 0,
                    availableQuantity: product.currentQuantity,
                    quantity: 1,
                },
            ];
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        setCart((prev) =>
            prev.map((l) => {
                if (l.productId !== productId) return l;
                const clamped = Math.max(0, Math.min(quantity, l.availableQuantity));
                return { ...l, quantity: clamped };
            })
        );
    };

    const removeLine = (productId: string) => {
        setCart((prev) => prev.filter((l) => l.productId !== productId));
        if (selectedLineId === productId) setSelectedLineId(null);
    };

    const handleKeypadPress = (key: string) => {
        if (!selectedLineId) return;
        const line = cart.find((l) => l.productId === selectedLineId);
        if (!line) return;

        if (key === 'C') {
            updateQuantity(selectedLineId, 0);
            return;
        }
        if (key === '⌫') {
            const current = String(line.quantity);
            const next = current.length > 1 ? current.slice(0, -1) : '0';
            updateQuantity(selectedLineId, parseInt(next, 10) || 0);
            return;
        }
        const current = line.quantity === 0 ? '' : String(line.quantity);
        const next = parseInt(current + key, 10);
        updateQuantity(selectedLineId, next);
    };

    const cartLines = cart.filter((l) => l.quantity > 0);
    const subtotal = useMemo(() => cartLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [cartLines]);
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    const handleCheckout = async () => {
        if (cartLines.length === 0) {
            toast.error('Adicione pelo menos um produto ao carrinho.');
            return;
        }
        try {
            const result = await checkoutMutation.mutateAsync({
                customerId: customerId || undefined,
                paymentMethod,
                items: cartLines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
            });
            setLastSale(result);
            setCart([]);
            setSelectedLineId(null);
            setCustomerId('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao finalizar a venda.');
        }
    };

    const handleOpenDocument = async (kind: 'INVOICE' | 'RECEIPT') => {
        if (!lastSale) return;
        setIsOpeningDocument(true);
        try {
            const blob = kind === 'INVOICE'
                ? await invoiceService.downloadInvoicePDF(lastSale.invoice.id, printFormat)
                : await receiptService.downloadReceiptPDF(lastSale.receipt.id, printFormat);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch {
            toast.error('Erro ao gerar o documento.');
        } finally {
            setIsOpeningDocument(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-5 h-full">
            {/* ── PRODUCT GRID ── */}
            <div className="flex flex-col gap-4 min-h-0 max-h-[46vh] lg:max-h-none lg:flex-1">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Posto de Venda</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Selecione os produtos para adicionar à venda.</p>
                </div>

                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar produto por nome ou SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-11 bg-white border border-slate-200 rounded-sm pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    />
                </div>

                <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
                    {isProductsLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 size={28} className="text-slate-300 animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                            <Package size={32} className="text-slate-200" />
                            <p className="text-sm font-medium text-slate-400">Nenhum produto encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                            {products.map((product) => {
                                const inCart = cart.find((l) => l.productId === product.id);
                                const outOfStock = product.currentQuantity <= 0;
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        disabled={outOfStock}
                                        className={cn(
                                            "relative flex flex-col items-start text-left p-3.5 rounded-sm border transition-all",
                                            outOfStock
                                                ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                                                : inCart
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                                        )}
                                    >
                                        {inCart && (
                                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                                                {inCart.quantity}
                                            </span>
                                        )}
                                        <div className="w-9 h-9 rounded-sm bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                                            <Package size={16} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{product.name}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{product.sku}</p>
                                        <div className="flex items-center justify-between w-full mt-2">
                                            <span className="text-sm font-bold text-primary">{(product.price || 0).toLocaleString()} Kz</span>
                                            <span className="text-[10px] text-slate-400">{product.currentQuantity} {product.unit}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── CART / CHECKOUT ── */}
            <div className="flex flex-col bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden max-h-[54vh] lg:max-h-none lg:w-[400px] lg:shrink-0">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <ShoppingCart size={18} className="text-primary" />
                    <h2 className="text-sm font-bold text-slate-800">Carrinho</h2>
                    <span className="ml-auto text-xs font-semibold text-slate-400">{cartLines.length} item(ns)</span>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2 min-h-[120px]">
                    {cartLines.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-8">
                            <ShoppingCart size={28} className="text-slate-200" />
                            <p className="text-xs font-medium text-slate-400">O carrinho está vazio.</p>
                        </div>
                    ) : (
                        cartLines.map((line) => (
                            <div
                                key={line.productId}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedLineId(line.productId)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') setSelectedLineId(line.productId);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-2.5 p-2.5 rounded-sm mb-1 text-left transition-colors cursor-pointer",
                                    selectedLineId === line.productId ? "bg-primary/5 border border-primary/30" : "border border-transparent hover:bg-slate-50"
                                )}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{line.name}</p>
                                    <p className="text-[10px] text-slate-400">{line.unitPrice.toLocaleString()} Kz / {line.unit}</p>
                                </div>

                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded-sm bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                    >
                                        <Minus size={11} />
                                    </button>
                                    <span className="w-7 text-center text-xs font-bold text-slate-800">{line.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded-sm bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>

                                <p className="w-20 text-right text-xs font-bold text-slate-900 shrink-0">
                                    {(line.unitPrice * line.quantity).toLocaleString()} Kz
                                </p>

                                <button
                                    onClick={(e) => { e.stopPropagation(); removeLine(line.productId); }}
                                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Calculator keypad — edits the selected line's quantity */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {selectedLineId ? 'Ajustar quantidade' : 'Selecione um item do carrinho'}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {KEYPAD_KEYS.map((key) => (
                            <button
                                key={key}
                                onClick={() => handleKeypadPress(key)}
                                disabled={!selectedLineId}
                                className={cn(
                                    "h-9 rounded-sm text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                                    key === '⌫' || key === 'C'
                                        ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                )}
                            >
                                {key === '⌫' ? <Delete size={14} className="mx-auto" /> : key}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Customer + payment method */}
                <div className="px-4 py-3 border-t border-slate-100 space-y-2.5">
                    <select
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-200 rounded-sm px-2.5 text-xs font-medium text-slate-600 outline-none focus:border-primary transition-all"
                    >
                        <option value="">Cliente Balcão</option>
                        {customers.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <div className="grid grid-cols-4 gap-1.5">
                        {PAYMENT_METHODS.map((pm) => (
                            <button
                                key={pm.value}
                                onClick={() => setPaymentMethod(pm.value)}
                                className={cn(
                                    "flex flex-col items-center gap-1 py-2 rounded-sm border text-[9px] font-bold uppercase tracking-tight transition-all",
                                    paymentMethod === pm.value
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <pm.icon size={14} />
                                {pm.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Totals + checkout */}
                <div className="relative px-5 py-4 border-t border-slate-100 bg-slate-900 text-white space-y-2 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-accent-warm" />
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Subtotal</span>
                        <span>{subtotal.toLocaleString()} Kz</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>IVA (14%)</span>
                        <span>{taxAmount.toLocaleString()} Kz</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-white/10">
                        <span>Total</span>
                        <span>{total.toLocaleString()} Kz</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cartLines.length === 0 || checkoutMutation.isPending}
                        className={cn(
                            "w-full mt-3 h-14 rounded-sm transition-all flex items-center justify-center gap-2",
                            "text-white text-base font-black uppercase tracking-wide",
                            "shadow-[0_8px_24px_-6px_rgba(196,100,58,0.55)]",
                            cartLines.length === 0 || checkoutMutation.isPending
                                ? "bg-slate-700 opacity-50 cursor-not-allowed shadow-none"
                                : "bg-accent-warm hover:bg-accent-warm-hover hover:shadow-[0_10px_28px_-6px_rgba(196,100,58,0.7)] active:scale-[0.98]"
                        )}
                    >
                        {checkoutMutation.isPending ? (
                            <><Loader2 size={20} className="animate-spin" /> A finalizar…</>
                        ) : (
                            <><ReceiptText size={20} /> Finalizar Venda</>
                        )}
                    </button>
                </div>
            </div>

            {/* ── SALE CONFIRMATION MODAL ── */}
            {lastSale && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
                                <CheckCircle2 size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Venda concluída!</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Fatura <span className="font-semibold text-slate-700">{lastSale.invoice.number}</span> · Recibo <span className="font-semibold text-slate-700">{lastSale.receipt.number}</span>
                            </p>
                            <p className="text-2xl font-bold text-slate-900 mt-3">{lastSale.receipt.amount.toLocaleString()} Kz</p>
                            <p className="text-[11px] text-slate-400 mt-2">
                                {lastSale.recommendedDocument === 'INVOICE'
                                    ? 'Venda de valor elevado — documento oficial: Fatura'
                                    : 'Venda de pequeno valor — documento oficial: Recibo'}
                            </p>

                            <div className="mt-4 flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => updatePrintFormat('A4')}
                                    className={cn(
                                        "flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                                        printFormat === 'A4' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <FileText size={13} /> A4
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updatePrintFormat('THERMAL')}
                                    className={cn(
                                        "flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                                        printFormat === 'THERMAL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <Receipt size={13} /> Térmica (80mm)
                                </button>
                            </div>

                            <button
                                onClick={() => handleOpenDocument(lastSale.recommendedDocument)}
                                disabled={isOpeningDocument}
                                className="w-full mt-4 h-10 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                {isOpeningDocument ? (
                                    <><Loader2 size={14} className="animate-spin" /> A gerar…</>
                                ) : lastSale.recommendedDocument === 'INVOICE' ? (
                                    <><FileText size={14} /> Ver / Imprimir Fatura</>
                                ) : (
                                    <><Printer size={14} /> Ver / Imprimir Recibo</>
                                )}
                            </button>

                            <button
                                onClick={() => setLastSale(null)}
                                className="w-full mt-2 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <X size={14} /> Nova venda
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
