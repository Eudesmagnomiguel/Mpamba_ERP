'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    Search, 
    Plus, 
    Filter, 
    MoreHorizontal, 
    Building2, 
    Globe,
    ArrowUpRight,
    LayoutGrid,
    List,
    Loader2,
    CheckCircle2,
    XCircle,
    Edit2,
    Mail,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganizations } from '@/hooks/module/organization';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { useApproveOrganization, useActivateDirectly } from '@/hooks/core/useAuth';
import { toast } from 'sonner';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import { useHasPermission } from '@/hooks/core/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api-error.utils';

export default function OrganizationsPage() {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const { data: orgsData, isLoading, isError } = useOrganizations();
    
    const queryClient = useQueryClient();
    const approveMutation = useApproveOrganization();
    const activateDirectlyMutation = useActivateDirectly();

    const hasOrgCreate = useHasPermission(PERMISSIONS.ORGANIZATION_CREATE);
    const hasOrgUpdate = useHasPermission(PERMISSIONS.ORGANIZATION_UPDATE);

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("E-mail de ativação enviado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        } catch (error: any) {
            toast.error(getApiErrorMessage(error, "Erro ao aprovar organização."));
        }
    };

    const handleActivateDirectly = async (id: string) => {
        try {
            await activateDirectlyMutation.mutateAsync(id);
            toast.success("Organização ativada diretamente com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        } catch (error: any) {
            toast.error(getApiErrorMessage(error, "Erro ao ativar organização."));
        }
    };

    const filteredOrgs = orgsData?.data?.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.nif?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Organizações</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gerencie as entidades e empresas que utilizam a plataforma Mpamba.</p>
                </div>

                {hasOrgCreate && (
                    <Link 
                        href="/admin/organizations/new"
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={18} />
                        Nova Organização
                    </Link>
                )}
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou NIF..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-sm text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filtros</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={cn("p-2 rounded-sm transition-all", viewMode === 'list' ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-50")}
                    >
                        <List size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={cn("p-2 rounded-sm transition-all", viewMode === 'grid' ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-50")}
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            {/* Organizations Content */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Organização</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contacto</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plano</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Usuários</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Data de Adesão</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Assinatura</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="text-primary animate-spin" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando organizações...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-red-500 font-bold">
                                        Erro ao carregar organizações.
                                    </td>
                                </tr>
                            ) : filteredOrgs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma organização encontrada.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrgs.map((org) => (
                                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 group-hover:border-primary/20 transition-all shadow-sm">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-none">{org.name}</p>
                                                    <div className="flex items-center gap-1 mt-1.5 text-slate-400">
                                                        <Globe size={10} />
                                                        <p className="text-[10px] font-medium tracking-tight">NIF: {org.nif || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Mail size={12} className="text-slate-400" />
                                                <span className="text-xs font-medium">{org.email || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-tighter border",
                                                org.plan?.code === 'enterprise' ? "bg-slate-900 text-white border-slate-900" : "bg-primary/5 text-primary border-primary/10"
                                            )}>
                                                {org.plan?.name || 'S/ PLANO'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-700">{org._count?.users ?? org.users?.length ?? 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                {format(new Date(org.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider",
                                                org.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400 border border-slate-200"
                                            )}>
                                                {org.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {org.isActive ? 'Ativo' : 'Inativo'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {org.subscription?.status ? (
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border",
                                                    org.subscription.status === 'ACTIVE' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                                                    org.subscription.status === 'TRIAL' && "bg-blue-50 text-blue-600 border-blue-100",
                                                    org.subscription.status === 'SUSPENDED' && "bg-amber-50 text-amber-600 border-amber-100",
                                                    org.subscription.status === 'PAST_DUE' && "bg-orange-50 text-orange-600 border-orange-100",
                                                    org.subscription.status === 'EXPIRED' && "bg-rose-50 text-rose-600 border-rose-100",
                                                    org.subscription.status === 'CANCELLED' && "bg-slate-100 text-slate-500 border-slate-200"
                                                )}>
                                                    {org.subscription.status === 'ACTIVE' && 'Ativa'}
                                                    {org.subscription.status === 'TRIAL' && 'Trial'}
                                                    {org.subscription.status === 'SUSPENDED' && 'Suspensa'}
                                                    {org.subscription.status === 'PAST_DUE' && 'Em atraso'}
                                                    {org.subscription.status === 'EXPIRED' && 'Expirada'}
                                                    {org.subscription.status === 'CANCELLED' && 'Cancelada'}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                                                {!org.isActive && hasOrgUpdate && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(org.id)}
                                                            disabled={approveMutation.isPending || activateDirectlyMutation.isPending}
                                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-sm transition-all disabled:opacity-50"
                                                            title="Aprovar e enviar e-mail"
                                                        >
                                                            <Mail size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleActivateDirectly(org.id)}
                                                            disabled={approveMutation.isPending || activateDirectlyMutation.isPending}
                                                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-sm transition-all disabled:opacity-50"
                                                            title="Ativar Diretamente"
                                                        >
                                                            <Zap size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {hasOrgUpdate && (
                                                    <Link 
                                                        href={`/admin/organizations/${org.id}/edit`}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                        title="Editar Organização"
                                                    >
                                                        <Edit2 size={18} />
                                                    </Link>
                                                )}
                                                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-sm transition-all">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Total: {orgsData?.pagination?.total || filteredOrgs.length} organizações
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 bg-white border border-slate-200 rounded-sm text-[10px] font-black text-slate-400 uppercase hover:bg-slate-50 transition-all shadow-sm">Anterior</button>
                        <button className="px-3 py-1 bg-white border border-slate-200 rounded-sm text-[10px] font-black text-slate-600 uppercase hover:bg-slate-50 transition-all shadow-sm">Próximo</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
