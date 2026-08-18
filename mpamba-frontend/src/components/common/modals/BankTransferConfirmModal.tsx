'use client';

import { useState } from 'react';
import { Landmark, Copy, Loader2, Check, ArrowRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import ENV from '@/shared/utils/env.utils';

interface BankTransferConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    planName?: string;
    currentPlanName?: string;
    isSubmitting?: boolean;
    onConfirm: (paymentReference: string) => void;
}

function CopyField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-b-0">
            <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
            </div>
            <button
                type="button"
                onClick={() => {
                    navigator.clipboard.writeText(value);
                    toast.success('Copiado!');
                }}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors shrink-0"
                aria-label={`Copiar ${label}`}
            >
                <Copy size={14} />
            </button>
        </div>
    );
}

export default function BankTransferConfirmModal({
    open,
    onOpenChange,
    planName,
    currentPlanName,
    isSubmitting = false,
    onConfirm,
}: BankTransferConfirmModalProps) {
    const [paymentReference, setPaymentReference] = useState('');

    const handleConfirm = () => {
        if (!paymentReference.trim()) return;
        onConfirm(paymentReference.trim());
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setPaymentReference(''); }}>
            <DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/60" />
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Landmark size={18} className="text-primary" />
                            Confirmar pagamento por transferência
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                            {planName ? (
                                <>Para ativar o plano <span className="font-semibold text-slate-700">{planName}</span>, efetue a transferência para a conta abaixo e indique o código/referência da operação.</>
                            ) : (
                                'Efetue a transferência para a conta abaixo e indique o código/referência da operação.'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {(currentPlanName || planName) && (
                        <div className="flex items-center gap-2.5 mb-4 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Plano atual</p>
                                <p className="font-semibold text-slate-600">{currentPlanName || '—'}</p>
                            </div>
                            <ArrowRight size={13} className="text-slate-300 shrink-0" />
                            <div>
                                <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">Novo plano</p>
                                <p className="font-bold text-primary">{planName || '—'}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 mb-4">
                        <CopyField label="Banco" value={ENV.COMPANY_BANK_NAME} />
                        <CopyField label="Titular" value={ENV.COMPANY_BANK_HOLDER} />
                        <CopyField label="IBAN / Número de Conta" value={ENV.COMPANY_BANK_IBAN} />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                            Código / Referência da transferência
                        </label>
                        <input
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="Ex: número de referência do comprovativo"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="mt-6 gap-2.5 flex-row justify-end">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="h-9 px-5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!paymentReference.trim() || isSubmitting}
                            className="h-9 px-5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm"
                        >
                            {isSubmitting ? (
                                <><Loader2 size={14} className="animate-spin" /> A enviar…</>
                            ) : (
                                <><Check size={14} /> Confirmar pedido</>
                            )}
                        </button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
