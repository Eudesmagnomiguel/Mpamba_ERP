'use client';

import React, { useState } from 'react';
import { 
    Users, 
    TrendingUp, 
    Plus,
    Download,
    Clock,
    AlertCircle,
    BarChart3,
    ArrowRight,
    FileCheck2,
    Receipt,
    Wallet,
    Calendar,
    ArrowUpCircle,
    Layers3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useBillingStats, useBillingInvoices } from '@/hooks/module/billing';
import { useTreasurySummary } from '@/hooks/module/treasury';
import { useAuthStore } from '@/store/auth.store';

export default function BillingPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [chartRange, setChartRange] = useState('6m');
    const { data: stats, isLoading: statsLoading } = useBillingStats();
    const { data: recentInvoicesData, isLoading: invoicesLoading } = useBillingInvoices({ limit: 5 });

    const isTreasuryActive = user?.modules?.includes('tesouraria') ?? false;
    const last30Days = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
    };
    const { data: treasurySummary } = useTreasurySummary(last30Days, { enabled: isTreasuryActive });

    const summary = stats || {
        totalInvoiced: 0,
        pendingPayments: 0,
        totalCustomers: 0,
        overdueInvoices: 0
    };

    const revenueData = stats?.monthlyRevenue ?? [];
    const recentInvoices = recentInvoicesData?.data || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
                
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Dashboard de Faturação
                    </h1>
                    <p className="text-slate-400 text-[11px] font-bold mt-1">Gestão inteligente de fluxos comerciais e financeiros</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <Button 
                        onClick={() => router.push('/billing/invoices/new')}
                        className="h-11 px-8 bg-primary hover:bg-primary-hover text-white rounded-sm font-black text-[10px] cursor-pointer  flex items-center gap-2"
                    >
                        <Plus size={14} />
                        Nova Fatura
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    {/* Stats Overview - Connected Design */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 sm:border-r transition-all hover:bg-slate-50/50 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingUp size={20} />
                                </div>
                                <p className="text-slate-400 text-[9px] font-black">Total faturado</p>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">
                                    {summary.totalInvoiced.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                </h3>
                                <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-emerald-500">
                                    <ArrowUpCircle size={10} />
                                    <span>+12.5% vs mês anterior</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-b border-slate-100 lg:border-b-0 lg:border-r transition-all hover:bg-slate-50/50 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Clock size={20} />
                                </div>
                                <p className="text-slate-400 text-[9px] font-black">Em aberto</p>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-xl font-black text-primary tracking-tight truncate">
                                    {summary.pendingPayments.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                </h3>
                                <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-400">
                                    <span>Pendentes de recebimento</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-b border-slate-100 sm:border-b-0 sm:border-r transition-all hover:bg-slate-50/50 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users size={20} />
                                </div>
                                <p className="text-slate-400 text-[9px] font-black">Clientes</p>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{summary.totalCustomers}</h3>
                                <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-400">
                                    <span>Base de dados ativa</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 transition-all hover:bg-slate-50/50 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <AlertCircle size={20} />
                                </div>
                                <p className="text-slate-400 text-[9px] font-black">Vencidas</p>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-xl font-black text-rose-500 tracking-tight">{summary.overdueInvoices}</h3>
                                <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-rose-400">
                                    <span>Ação necessária urgente</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Chart */}
                    <Card className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50 px-6 py-5">
                            <CardTitle className="text-[11px] font-black text-slate-900 flex items-center gap-2">
                                <BarChart3 size={16} className="text-primary" />
                                Desempenho de Receita
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Select value={chartRange} onValueChange={setChartRange}>
                                    <SelectTrigger className="h-8 text-[10px] bg-slate-50 border-slate-100 rounded-sm font-black text-slate-500 px-3 hover:border-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-sm">
                                        <SelectItem value="6m">Últimos 6 meses</SelectItem>
                                        <SelectItem value="year">Este ano</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} 
                                            dy={15} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} 
                                            tickFormatter={(value) => `${value/1000}k`} 
                                            dx={-10}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '2px', 
                                                border: '1px solid #f1f5f9', 
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                                                fontSize: '11px',
                                                fontWeight: '800'
                                            }}
                                            itemStyle={{ color: 'var(--primary)' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="var(--primary)" 
                                            strokeWidth={3} 
                                            fillOpacity={1} 
                                            fill="url(#colorValue)" 
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Summary Card - Premium Primary */}
                    <Card className="border-none shadow-xl shadow-primary/10 rounded-sm bg-primary text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                            <Wallet size={120} />
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20" />
                        
                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <p className="text-[10px] font-black text-white/60">Volume de caixa (30d)</p>
                            </div>
                            {isTreasuryActive ? (
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-3xl font-black tracking-tight leading-none">
                                            {(treasurySummary?.totalIncomes ?? 0).toLocaleString('pt-AO')}
                                        </h2>
                                        <span className="text-xs font-bold text-white/40">Kz</span>
                                    </div>
                                    <p className="text-[11px] mt-4 text-white/50 leading-relaxed font-bold">
                                        Total de liquidações processadas e confirmadas no período atual.
                                    </p>
                                </>
                            ) : (
                                <p className="text-[11px] mt-2 text-white/60 leading-relaxed font-bold">
                                    Ative o módulo de Tesouraria para acompanhar aqui o volume de caixa recebido.
                                </p>
                            )}
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/treasury')}
                                className="mt-8 w-full bg-white hover:bg-white text-primary rounded-sm text-[10px] font-black h-12 border border-white/10 transition-all shadow-lg shadow-black/5"
                            >
                                Detalhes de tesouraria
                                <ArrowRight size={14} className="ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-slate-200 shadow-sm rounded-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4 px-6 pt-6 border-b border-slate-50">
                            <CardTitle className="text-[10px] font-black text-slate-400">Painel de operações</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {[
                                { name: 'Séries de faturação', sub: 'Gestão de prefixos fiscais', icon: Layers3, href: '/billing/documents' },
                                { name: 'Nova proforma', sub: 'Emitir cotação comercial', icon: FileCheck2, href: '/billing/proformas/new' },
                                { name: 'Liquidar fatura', sub: 'Emitir recibo de quitação', icon: Receipt, href: '/billing/receipts/new' },
                                { name: 'Gestão de clientes', sub: 'Base de dados de entidades', icon: Users, href: '/billing/customers' },
                            ].map((action, i) => (
                                <button 
                                    key={i}
                                    onClick={() => action.href && router.push(action.href)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-0"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                            {React.createElement(action.icon as any, { size: 18 })}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-black text-slate-900">{action.name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold mt-0.5">{action.sub}</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
