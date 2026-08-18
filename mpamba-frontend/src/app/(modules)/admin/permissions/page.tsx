'use client';

import React, { useState } from 'react';
import {
    Shield,
    Plus,
    Search,
    Settings,
    Users,
    Building2,
    Package,
    Edit2,
    Trash2,
    Loader2,
    Zap,
    History,
    LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/core/usePermission';
import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import CreatePermissionModal from '@/components/admin/permissions/modals/CreatePermissionModal';
import EditPermissionModal from '@/components/admin/permissions/modals/EditPermissionModal';

// Helper to map prefix to Module metadata
const getModuleInfo = (prefix: string) => {
    switch (prefix.toLowerCase()) {
        case 'user':
            return { name: 'Usuários', icon: Users };
        case 'org':
            return { name: 'Organizações', icon: Building2 };
        case 'plan':
            return { name: 'Planos', icon: Package };
        case 'module':
            return { name: 'Módulos', icon: LayoutGrid };
        case 'setting':
            return { name: 'Configurações', icon: Settings };
        case 'log':
            return { name: 'Histórico', icon: History };
        case 'auth':
            return { name: 'Autenticação', icon: Zap };
        default:
            return { name: 'Outros', icon: Shield };
    }
};

export default function PermissionsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: permissionsData, isLoading, isError } = usePermissions();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);

    const user = useAuthStore(state => state.user);
    const hasPermissionCreate = user?.permissions?.includes(PERMISSIONS.PERMISSION_CREATE);
    const hasPermissionUpdate = user?.permissions?.includes(PERMISSIONS.PERMISSION_UPDATE);
    const hasPermissionDelete = user?.permissions?.includes(PERMISSIONS.PERMISSION_DELETE);

    // Group permissions dynamically
    const permissions = permissionsData?.data || [];
    const filteredPermissions = permissions.filter(p =>
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedPermissions = filteredPermissions.reduce((acc: any, permission) => {
        const prefix = permission.code.split(':')[0] || 'other';
        if (!acc[prefix]) {
            acc[prefix] = {
                ...getModuleInfo(prefix),
                permissions: []
            };
        }
        acc[prefix].permissions.push(permission);
        return acc;
    }, {});

    const groups = Object.entries(groupedPermissions).sort();

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Permissões</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Controle granular das funcionalidades acessíveis no ecossistema.</p>
                </div>

                {hasPermissionCreate && (
                    <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20">
                        <Plus size={18} />
                        Nova Permissão
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filtrar permissão por código ou descrição..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-sm border border-slate-100">
                    Total: <span className="text-primary">{filteredPermissions.length} Permissões</span>
                </div>
            </div>

            {/* Permissions Content */}
            <div className="space-y-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={40} className="text-primary animate-spin" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando permissões...</p>
                    </div>
                ) : isError ? (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-8 rounded-sm text-center font-bold">
                        Ocorreu um erro ao carregar as permissões.
                    </div>
                ) : groups.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 p-20 rounded-sm text-center">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhuma permissão encontrada.</p>
                    </div>
                ) : (
                    groups.map(([prefix, group]: any) => (
                        <div key={prefix} className="space-y-5">
                            <div className="flex items-center gap-3 px-1">
                                <div className="p-2 bg-slate-100 rounded-sm text-slate-600 border border-slate-200 shadow-sm">
                                    <group.icon size={18} />
                                </div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{group.name}</h2>
                                <div className="h-px flex-1 bg-slate-200/60 ml-2"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.permissions.map((perm: any) => (
                                    <div key={perm.id} className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group flex items-start justify-between">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-sm bg-primary/5 flex items-center justify-center">
                                                    <Shield size={12} className="text-primary/70" />
                                                </div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{perm.description || 'Sem Descrição'}</h4>
                                            </div>
                                            <code className="inline-block text-[10px] font-mono font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-sm border border-slate-100 group-hover:text-primary transition-colors">
                                                {perm.code}
                                            </code>
                                        </div>

                                        <div className="flex flex-col gap-1 opacity-100 transition-opacity">
                                            {hasPermissionUpdate && (
                                                <button onClick={() => { setSelectedPermissionId(perm.id); setIsEditOpen(true); }} className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-sm transition-all" title="Editar">
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                            {hasPermissionDelete && (
                                                <button className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-sm transition-all" title="Remover">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            <CreatePermissionModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <EditPermissionModal isOpen={isEditOpen} permissionId={selectedPermissionId} onClose={() => { setIsEditOpen(false); setSelectedPermissionId(null); }} />
        </div>
    );
}
