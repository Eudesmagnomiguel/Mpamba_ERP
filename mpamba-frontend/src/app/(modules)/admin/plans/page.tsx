'use client';

import { useRouter } from 'next/navigation';
import { 
    Plus, 
    Check, 
    MoreHorizontal, 
    Zap, 
    Building2, 
    TrendingUp, 
    Edit3,
    Trash2,
    Eye,
    Loader2
} from 'lucide-react';
import { usePlans } from '@/hooks/core/usePlan';
import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/shared/constants/permission.constants';

export default function PlansPage() {
    const router = useRouter();
    const { data: plansData, isLoading, isError } = usePlans();

    const user = useAuthStore(state => state.user);
    const hasPlanCreate = user?.permissions?.includes(PERMISSIONS.PLAN_CREATE);
    const hasPlanUpdate = user?.permissions?.includes(PERMISSIONS.PLAN_UPDATE);
    const hasPlanDelete = user?.permissions?.includes(PERMISSIONS.PLAN_DELETE);

    const plans = plansData?.data || [];

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Planos</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Configure as opções de subscrição e preços da plataforma.</p>
                </div>

                {hasPlanCreate && (
                    <button 
                        onClick={() => router.push('/admin/plans/new')}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={18} />
                        Criar Novo Plano
                    </button>
                )}
            </div>

            {/* Plans List */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Planos Disponíveis</h2>
                </div>
                
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plano</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Preço & Ciclo</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Organizações</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Módulos</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 relative">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="text-primary animate-spin" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando planos...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-red-500 font-bold">
                                        Erro ao carregar planos.
                                    </td>
                                </tr>
                            ) : plans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum plano encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-8 rounded-sm bg-primary" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-none">{plan.name}</p>
                                                    <p className="text-[11px] text-slate-400 mt-1.5 font-bold uppercase tracking-tighter">CODE: {plan.code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(plan.price)}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium capitalize">{plan.interval}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-slate-400" />
                                                <span className="text-sm font-bold text-slate-700">{plan.organizations?.length || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[250px]">
                                                {plan.modules?.map((pm: any, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-primary/5 text-primary rounded-sm text-[10px] font-black uppercase border border-primary/10 tracking-tight" title={pm.name}>
                                                        {pm.name || pm.code}
                                                    </span>
                                                ))}
                                                {(!plan.modules || plan.modules.length === 0) && (
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Sem módulos</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                                                {hasPlanUpdate && (
                                                    <button 
                                                        onClick={() => router.push(`/admin/plans/${plan.id}/edit`)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all" 
                                                        title="Editar"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                )}
                                                {hasPlanDelete && (
                                                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-all" title="Arquivar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Table Footer */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Total: {plansData?.pagination?.total || plans.length} planos
                    </p>
                </div>
            </div>
        </div>
    );
}
