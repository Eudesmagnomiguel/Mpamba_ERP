'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    MoreHorizontal,
    UserPlus,
    Mail,
    Shield,
    CheckCircle2,
    XCircle,
    Download,
    Building2,
    Loader2,
    Edit2,
    Clock,
    List,
    LayoutGrid,
    ChevronDown,
    ChevronRight,
    Users as UsersIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/core/useUser';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import type { User } from '@/shared/types/models';

function RoleBadges({ user }: { user: User }) {
    if (!user.roles || user.roles.length === 0) {
        return <span className="text-xs font-medium text-slate-400">Sem papel</span>;
    }
    return (
        <div className="flex flex-wrap gap-1.5">
            {user.roles.map((ur) => (
                <span
                    key={ur.roleId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200"
                >
                    <Shield size={10} className="text-slate-400" />
                    {ur.role?.name || '—'}
                </span>
            ))}
        </div>
    );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider",
            isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"
        )}>
            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {isActive ? 'Ativo' : 'Inativo'}
        </div>
    );
}

function OnboardingBadge({ completedAt }: { completedAt?: string | null }) {
    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider",
            completedAt ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
        )}>
            {completedAt ? <CheckCircle2 size={12} /> : <Clock size={12} />}
            {completedAt ? 'Completo' : 'Pendente'}
        </div>
    );
}

export default function UsersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
    const [expandedOrgIds, setExpandedOrgIds] = useState<Set<string>>(new Set());
    const { data: usersData, isLoading, isError } = useUsers({ pageSize: 500 });

    const user = useAuthStore(state => state.user);
    const hasUserCreate = user?.permissions?.includes(PERMISSIONS.USER_CREATE);
    const hasUserUpdate = user?.permissions?.includes(PERMISSIONS.USER_UPDATE);

    const filteredUsers = usersData?.data?.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.organization?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const orgGroups = useMemo(() => {
        const groups = new Map<string, { org: NonNullable<User['organization']> | null; users: User[] }>();
        for (const u of filteredUsers) {
            const key = u.organizationId || 'SISTEMA';
            if (!groups.has(key)) {
                groups.set(key, { org: u.organization ?? null, users: [] });
            }
            groups.get(key)!.users.push(u);
        }
        return Array.from(groups.entries()).map(([id, value]) => ({ id, ...value }));
    }, [filteredUsers]);

    const toggleOrg = (id: string) => {
        setExpandedOrgIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gerencie as contas e permissões de acesso da plataforma.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-sm text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={16} />
                        Exportar
                    </button>
                    {hasUserCreate && (
                        <Link
                            href="/admin/users/new"
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                        >
                            <UserPlus size={16} />
                            Novo Usuário
                        </Link>
                    )}
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
                        placeholder="Pesquisar por nome, email ou organização..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
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
                        <option>Todos os Papéis</option>
                        <option>Super Admin</option>
                        <option>Admin</option>
                        <option>User</option>
                    </select>

                    <div className="flex items-center gap-1 border-l border-slate-100 pl-3 shrink-0">
                        <button
                            onClick={() => setViewMode('list')}
                            title="Vista em lista"
                            className={cn("p-2 rounded-sm transition-all", viewMode === 'list' ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-50")}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grouped')}
                            title="Vista por organização"
                            className={cn("p-2 rounded-sm transition-all", viewMode === 'grouped' ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-50")}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'list' ? (
                /* ── LIST VIEW ── */
                <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Usuário</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Organização</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Papel</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Onboarding</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Criado em</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 relative">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 size={32} className="text-primary animate-spin" />
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando usuários...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center text-red-500 font-bold">
                                            Erro ao carregar usuários. Verifique sua conexão.
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum usuário encontrado.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/5 uppercase">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none">{u.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-1.5 text-slate-400">
                                                            <Mail size={12} />
                                                            <p className="text-xs font-medium">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Building2 size={14} className="text-slate-400" />
                                                    <span className="text-sm font-semibold">{u.organization?.name || 'SISTEMA'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><RoleBadges user={u} /></td>
                                            <td className="px-6 py-4"><StatusBadge isActive={u.isActive} /></td>
                                            <td className="px-6 py-4"><OnboardingBadge completedAt={u.onboardingCompletedAt} /></td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                    {format(new Date(u.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                                                    {hasUserUpdate && (
                                                        <Link
                                                            href={`/admin/users/${u.id}/edit`}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                            title="Editar Usuário"
                                                        >
                                                            <Edit2 size={18} />
                                                        </Link>
                                                    )}
                                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-all">
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

                    {/* Table Footer */}
                    <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Total: {usersData?.pagination?.total || filteredUsers.length} usuários
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-sm text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all">Anterior</button>
                            <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-sm text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Próximo</button>
                        </div>
                    </div>
                </div>
            ) : (
                /* ── GROUPED-BY-ORGANIZATION VIEW ── */
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="bg-white border border-slate-200 rounded-sm py-20 flex items-center justify-center">
                            <Loader2 size={28} className="text-primary animate-spin" />
                        </div>
                    ) : isError ? (
                        <div className="bg-white border border-slate-200 rounded-sm py-20 text-center text-red-500 font-bold">
                            Erro ao carregar usuários. Verifique sua conexão.
                        </div>
                    ) : orgGroups.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-sm py-20 text-center">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum usuário encontrado.</p>
                        </div>
                    ) : (
                        orgGroups.map(({ id, org, users }) => {
                            const isExpanded = expandedOrgIds.has(id);
                            return (
                                <div key={id} className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => toggleOrg(id)}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors text-left"
                                    >
                                        {isExpanded ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                                        <div className="w-11 h-11 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                            <Building2 size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900">{org?.name || 'SISTEMA'}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {org?.nif && (
                                                    <span className="text-[11px] text-slate-400 font-medium">NIF: {org.nif}</span>
                                                )}
                                                {org?.plan?.name && (
                                                    <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-sm bg-primary/5 text-primary border border-primary/10">
                                                        Plano: {org.plan.name}
                                                    </span>
                                                )}
                                                {org && (
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border",
                                                        org.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                                                    )}>
                                                        {org.isActive ? 'Ativa' : 'Inativa'}
                                                    </span>
                                                )}
                                                {(org?.modules || []).filter(m => m.isActive).map((m) => (
                                                    <span
                                                        key={m.moduleId}
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-50 text-slate-500 border border-slate-200"
                                                    >
                                                        {m.module?.name || m.moduleId}
                                                    </span>
                                                ))}
                                                {org && (org.modules || []).filter(m => m.isActive).length === 0 && (
                                                    <span className="text-[10px] font-medium text-slate-400 italic">Sem módulos ativos</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 shrink-0">
                                            <UsersIcon size={14} />
                                            <span className="text-sm font-bold">{users.length}</span>
                                            <span className="text-[11px] text-slate-400">usuário{users.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-slate-100">
                                            {org && (
                                                <div className="px-5 py-3 bg-slate-50/60 flex flex-wrap gap-x-8 gap-y-1.5 border-b border-slate-100">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                                                        <p className="text-xs font-semibold text-slate-700">{org.email || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assinatura</p>
                                                        <p className="text-xs font-semibold text-slate-700">{org.subscription?.status || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aderiu em</p>
                                                        <p className="text-xs font-semibold text-slate-700">{format(new Date(org.createdAt), 'dd MMM yyyy', { locale: ptBR })}</p>
                                                    </div>
                                                    <Link
                                                        href={`/admin/organizations/${id}/edit`}
                                                        className="ml-auto text-[11px] font-bold text-primary hover:text-primary-hover self-center"
                                                    >
                                                        Ver organização →
                                                    </Link>
                                                </div>
                                            )}
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50/30 border-b border-slate-100">
                                                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuário</th>
                                                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Papel</th>
                                                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onboarding</th>
                                                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {users.map((u) => (
                                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                                                                        {u.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-slate-900 leading-none">{u.name}</p>
                                                                        <p className="text-[10px] text-slate-400 mt-1">{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3"><RoleBadges user={u} /></td>
                                                            <td className="px-5 py-3"><StatusBadge isActive={u.isActive} /></td>
                                                            <td className="px-5 py-3"><OnboardingBadge completedAt={u.onboardingCompletedAt} /></td>
                                                            <td className="px-5 py-3 text-right">
                                                                {hasUserUpdate && (
                                                                    <Link
                                                                        href={`/admin/users/${u.id}/edit`}
                                                                        className="inline-flex p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                                        title="Editar Usuário"
                                                                    >
                                                                        <Edit2 size={15} />
                                                                    </Link>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
