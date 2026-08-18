'use client';

import React from 'react';
import { 
    Users, 
    ShieldCheck, 
    CreditCard, 
    CheckCircle2, 
    AlertTriangle,
    Zap,
    Box,
    FileText,
    Wallet,
    ArrowRight,
    TrendingUp,
    Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/common/forms/Button';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useUsers } from '@/hooks/core/useUser';
import { useRoles } from '@/hooks/core/useRole';
import { useMySubscription } from '@/hooks/core/useSubscription';
import { cn } from '@/lib/utils';

const KNOWN_MODULES: Record<string, { name: string; icon: React.ElementType; description: string }> = {
    faturacao: { name: 'Faturação & Billing', icon: FileText, description: 'Gestão de faturas, recibos e notas de crédito.' },
    billing: { name: 'Faturação & Billing', icon: FileText, description: 'Gestão de faturas, recibos e notas de crédito.' },
    stock: { name: 'Gestão de Stock', icon: Box, description: 'Controlo de inventário e movimentos de armazém.' },
    tesouraria: { name: 'Tesouraria', icon: Wallet, description: 'Controlo de caixa, bancos e fluxos financeiros.' },
    treasury: { name: 'Tesouraria', icon: Wallet, description: 'Controlo de caixa, bancos e fluxos financeiros.' },
};

// Classes completas e literais (não interpoladas) para o Tailwind conseguir detectá-las.
const ACCENT_STYLES = {
    'chart-1': { icon: 'bg-chart-1/10 text-chart-1', solid: 'bg-chart-1' },
    'chart-2': { icon: 'bg-chart-2/10 text-chart-2', solid: 'bg-chart-2' },
    'chart-3': { icon: 'bg-chart-3/10 text-chart-3', solid: 'bg-chart-3' },
    'chart-4': { icon: 'bg-chart-4/10 text-chart-4', solid: 'bg-chart-4' },
    'chart-5': { icon: 'bg-chart-5/10 text-chart-5', solid: 'bg-chart-5' },
} as const;

const MODULE_ACCENTS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const;

function daysRemaining(endDate?: string | null) {
    if (!endDate) return null;
    const diffMs = new Date(endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function CoreDashboardPage() {
    const { user } = useAuthStore();

    const { data: usersData } = useUsers({ pageSize: 1 });
    const { data: rolesData } = useRoles({ pageSize: 1 });
    const { data: subscription } = useMySubscription();

    const activeModuleCodes = user?.modules ?? [];
    const remainingDays = daysRemaining(subscription?.endDate);

    const stats = [
        { label: 'Utilizadores', value: String(usersData?.pagination?.total ?? '—'), icon: Users, accent: 'chart-1' },
        { label: 'Funções Definidas', value: String(rolesData?.pagination?.total ?? '—'), icon: ShieldCheck, accent: 'chart-2' },
        { label: 'Módulos Ativos', value: String(activeModuleCodes.length), icon: Zap, accent: 'chart-3' },
        { label: 'Duração Plano', value: remainingDays !== null ? `${remainingDays}d` : '—', icon: CreditCard, accent: 'chart-4' },
    ];

    const modules = activeModuleCodes.length
        ? activeModuleCodes.map((code, i) => {
            const known = KNOWN_MODULES[code.toLowerCase()];
            return {
                name: known?.name ?? code,
                icon: known?.icon ?? Box,
                status: 'Ativo' as const,
                accent: MODULE_ACCENTS[i % MODULE_ACCENTS.length],
                description: known?.description ?? 'Módulo activo para a sua organização.',
            };
        })
        : [{ name: 'Nenhum módulo activo', icon: AlertTriangle, status: 'Inativo' as const, accent: 'chart-5' as const, description: 'Contacte o administrador para activar módulos.' }];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Banner */}
            <div className="gradient-brand rounded-sm p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-grid-overlay opacity-40 pointer-events-none" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-accent-warm/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-1 w-8 bg-accent-warm rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-warm">Administração da Organização</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Olá, {user?.name?.split(' ')[0] || 'Administrador'}</h1>
                    <p className="text-slate-300 text-lg font-medium max-w-2xl italic">Gerencie os acessos, módulos e subscrições da sua empresa num único lugar.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all bg-white rounded-sm overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner", ACCENT_STYLES[stat.accent as keyof typeof ACCENT_STYLES].icon)}>
                                    <stat.icon size={24} />
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo</div>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">{stat.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Modules Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 text-primary rounded-sm flex items-center justify-center">
                                <Box size={18} />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Módulos do Sistema</h2>
                        </div>
                        <Link href="/core/modules" className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1">
                            Gerenciar Módulos <ArrowRight size={12} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {modules.map((mod, i) => (
                            <Card key={i} className={cn(
                                "border border-slate-100 shadow-sm rounded-sm hover:border-primary/30 transition-all group overflow-hidden",
                                mod.status === 'Inativo' && "opacity-60 grayscale"
                            )}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center text-white shadow-lg", ACCENT_STYLES[mod.accent as keyof typeof ACCENT_STYLES].solid)}>
                                            <mod.icon size={24} />
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                            mod.status === 'Ativo' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                                        )}>
                                            {mod.status}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">{mod.name}</h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">{mod.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Security & Access */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-sm flex items-center justify-center">
                            <Shield size={18} />
                        </div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Segurança & Acesso</h2>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                        
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-sm border border-slate-100 group cursor-pointer hover:bg-white hover:border-rose-200 transition-all">
                            <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center text-rose-500 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-900 uppercase">Gestão de Funções</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Configurar níveis de acesso</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-sm border border-slate-100 group cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
                            <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center text-blue-500 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <Users size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-900 uppercase">Equipa & Convites</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Gerenciar membros da empresa</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-sm flex items-start gap-3">
                                <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                                <div>
                                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight">Dica de Segurança</p>
                                    <p className="text-[9px] text-amber-700 font-medium mt-1 leading-relaxed italic">
                                        Mantenha as permissões da sua equipa atualizadas. Revise os acessos mensalmente para garantir a integridade dos dados.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
