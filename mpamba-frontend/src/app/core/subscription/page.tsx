'use client';

import React, { useState } from 'react';
import {
    CreditCard,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Clock,
    Loader2,
    ArrowRight,
    TrendingUp,
    History,
    Info,
    Check,
    RefreshCw,
    ArrowUpRight,
    Copy,
    Boxes
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/common/forms/Button';
import { useMySubscription } from '@/hooks/core/useSubscription';
import { usePlans } from '@/hooks/core/usePlan';
import { useSubscriptionRequests, useCreateSubscriptionRequest } from '@/hooks/core/useSubscriptionRequest';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import BankTransferConfirmModal from '@/components/common/modals/BankTransferConfirmModal';

export default function CoreSubscriptionPage() {
    // Track which plan button is loading
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const [pendingRequest, setPendingRequest] = useState<{ planId: string; planName?: string; type: 'RENEWAL' | 'UPGRADE' } | null>(null);

    const { data: subData, isLoading: isSubLoading } = useMySubscription();
    const { data: plansData, isLoading: isPlansLoading } = usePlans();
    const { data: requestsData, isLoading: isRequestsLoading } = useSubscriptionRequests();

    const createRequestMutation = useCreateSubscriptionRequest();

    const sub = subData?.data;
    const plans = plansData?.data || [];
    const requests = requestsData || [];

    const handleRequestPlan = async (planId: string, type: 'RENEWAL' | 'UPGRADE', paymentReference: string) => {
        setLoadingPlanId(planId);
        try {
            await createRequestMutation.mutateAsync({ planId, type, paymentReference });
            toast.success('Pedido enviado com sucesso! Aguarde a aprovação do administrador.');
            setPendingRequest(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao enviar pedido.');
        } finally {
            setLoadingPlanId(null);
        }
    };

    if (isSubLoading || isPlansLoading) {
        return (
            <div className="py-24 flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <Loader2 size={28} className="text-slate-300 animate-spin" />
                <p className="text-xs text-slate-400">A carregar subscrição…</p>
            </div>
        );
    }

    const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
        ACTIVE:    { label: 'Ativa',    dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        SUSPENDED: { label: 'Suspensa', dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-100' },
        EXPIRED:   { label: 'Expirada', dot: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-600 border-rose-100' },
        CANCELLED: { label: 'Cancelada',dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-500 border-slate-200' },
    };
    const statusInfo = statusConfig[sub?.status || ''] ?? statusConfig['ACTIVE'];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">

            {/* ── CURRENT PLAN CARD ── */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-transparent" />

                <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left: plan info */}
                    <div className="lg:col-span-3 flex flex-col justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-1.5 mb-3">
                                <CreditCard size={12} className="text-slate-500" />
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Plano atual</p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    {sub?.plan?.name || '—'}
                                </h1>
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                                    statusInfo.badge
                                )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dot)} />
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Calendar size={14} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Expira em</p>
                                    <p className="text-sm font-semibold text-white">
                                        {sub?.endDate ? format(new Date(sub.endDate), "dd MMM, yyyy", { locale: ptBR }) : 'Permanente'}
                                    </p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-slate-800" />
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Boxes size={14} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Módulos</p>
                                    <p className="text-sm font-semibold text-white" title={(sub?.plan?.modules || []).map((m: any) => m.name).join(', ')}>
                                        {sub?.plan?.modules?.length || 0} ativo{sub?.plan?.modules?.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-slate-800" />
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <RefreshCw size={14} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Auto-renovar</p>
                                    <p className="text-sm font-semibold text-white">
                                        {sub?.autoRenew ? 'Sim' : 'Não'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={() => sub?.plan?.id && setPendingRequest({ planId: sub.plan.id, planName: sub.plan.name, type: 'RENEWAL' })}
                                disabled={!sub?.plan?.id || loadingPlanId === sub?.plan?.id}
                                className="inline-flex items-center gap-2 h-9 px-5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 text-xs font-semibold rounded-lg transition-all shadow-sm"
                            >
                                {loadingPlanId === sub?.plan?.id ? (
                                    <><Loader2 size={13} className="animate-spin" /> A enviar…</>
                                ) : (
                                    <><RefreshCw size={13} /> Solicitar renovação</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right: módulos incluídos no plano */}
                    <div className="lg:col-span-2 bg-white/[0.04] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Boxes size={15} className="text-primary" />
                                <h3 className="text-xs font-semibold text-white">Módulos incluídos</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                {sub?.plan?.modules?.length || 0} módulo{sub?.plan?.modules?.length === 1 ? '' : 's'} ativo{sub?.plan?.modules?.length === 1 ? '' : 's'} no seu plano atual.
                            </p>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto max-h-48">
                            {(sub?.plan?.modules?.length ?? 0) > 0 ? (
                                sub!.plan!.modules.map((m: any) => (
                                    <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg">
                                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                        <span className="text-xs font-semibold text-white">{m.name}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-500">Nenhum módulo ativo no seu plano.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PLANS ── */}
            <div className="space-y-5">
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Planos disponíveis</p>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Escolha o plano certo para si</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {plans.map((plan: any) => {
                        const isCurrent = sub?.plan?.id === plan.id;
                        const isLoading = loadingPlanId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    "relative bg-white rounded-xl border transition-all flex flex-col overflow-hidden",
                                    isCurrent
                                        ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                                        : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                                )}
                            >
                                {/* Current plan ribbon */}
                                {isCurrent && (
                                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary to-primary/50" />
                                )}

                                <div className="p-6 flex flex-col flex-1 gap-6">
                                    {/* Name + price */}
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
                                            {isCurrent && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full border border-primary/20 shrink-0">
                                                    <Check size={9} /> Atual
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-slate-900">{(plan.price).toLocaleString('pt-PT')}</span>
                                            <span className="text-xs text-slate-400 font-medium">AOA/mês</span>
                                        </div>
                                    </div>

                                    {/* Modules */}
                                    <ul className="space-y-2.5 flex-1">
                                        {(plan.modules || []).map((mod: any, idx: number) => (
                                            <li key={idx} className="flex items-center gap-2.5">
                                                <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                    <Check size={9} className="text-emerald-600" />
                                                </div>
                                                <span className="text-xs text-slate-600 font-medium">{mod.name || mod.code || mod}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <button
                                        onClick={() => !isCurrent && setPendingRequest({ planId: plan.id, planName: plan.name, type: 'UPGRADE' })}
                                        disabled={isCurrent || isLoading}
                                        className={cn(
                                            "w-full h-9 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2",
                                            isCurrent
                                                ? "bg-slate-50 text-slate-400 border border-slate-200 cursor-default"
                                                : isLoading
                                                    ? "bg-primary/80 text-white cursor-wait"
                                                    : "bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
                                        )}
                                    >
                                        {isCurrent ? (
                                            'Plano ativado'
                                        ) : isLoading ? (
                                            <><Loader2 size={13} className="animate-spin" /> A enviar pedido…</>
                                        ) : (
                                            <><ArrowUpRight size={13} /> Solicitar upgrade</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── REQUESTS HISTORY ── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <History size={16} className="text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-700">Histórico de pedidos</h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {isRequestsLoading ? (
                        <div className="p-16 flex justify-center">
                            <Loader2 size={24} className="animate-spin text-slate-200" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-16 text-center">
                            <History size={32} className="mx-auto text-slate-100 mb-3" />
                            <p className="text-sm text-slate-400 font-medium">Nenhum pedido efetuado ainda</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Plano</th>
                                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Resultado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {requests.map((req: any) => (
                                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {format(new Date(req.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border",
                                                req.type === 'RENEWAL'
                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                    : "bg-violet-50 text-violet-600 border-violet-100"
                                            )}>
                                                {req.type === 'RENEWAL' ? <RefreshCw size={10} /> : <ArrowUpRight size={10} />}
                                                {req.type === 'RENEWAL' ? 'Renovação' : 'Upgrade'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* White card style — same as admin page */}
                                            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                                <span className="text-xs font-semibold text-slate-700">{req.plan?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                                                req.status === 'PENDING'  && "bg-amber-50 text-amber-700 border-amber-100",
                                                req.status === 'APPROVED' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                                                req.status === 'REJECTED' && "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {req.status === 'PENDING'  && <><Clock size={10} /> Em análise</>}
                                                {req.status === 'APPROVED' && <><CheckCircle2 size={10} /> Aprovado</>}
                                                {req.status === 'REJECTED' && <><AlertCircle size={10} /> Rejeitado</>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.activationCode ? (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(req.activationCode);
                                                        toast.success('Código copiado!');
                                                    }}
                                                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shadow-sm group"
                                                >
                                                    <span className="tracking-widest">{req.activationCode}</span>
                                                    <Copy size={11} className="text-slate-400 group-hover:text-white transition-colors" />
                                                </button>
                                            ) : req.status === 'APPROVED' ? (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                                                    <CheckCircle2 size={12} /> Aplicado
                                                </span>
                                            ) : req.status === 'REJECTED' ? (
                                                <span className="text-[11px] text-slate-400 font-medium">—</span>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 font-medium italic">A aguardar…</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Info note */}
                <div className="flex items-start gap-3.5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-blue-800 mb-0.5">Como funciona?</p>
                        <p className="text-[11px] text-blue-600 leading-relaxed">
                            Após enviar o pedido, o administrador analisa a transferência e aprova diretamente —
                            o plano é atualizado automaticamente, sem necessidade de código.
                        </p>
                    </div>
                </div>
            </div>

            <BankTransferConfirmModal
                currentPlanName={sub?.plan?.name}
                open={!!pendingRequest}
                onOpenChange={(open) => { if (!open) setPendingRequest(null); }}
                planName={pendingRequest?.planName}
                isSubmitting={!!pendingRequest && loadingPlanId === pendingRequest.planId}
                onConfirm={(paymentReference) => {
                    if (pendingRequest) {
                        handleRequestPlan(pendingRequest.planId, pendingRequest.type, paymentReference);
                    }
                }}
            />
        </div>
    );
}