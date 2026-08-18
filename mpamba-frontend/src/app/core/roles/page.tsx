'use client';

import React, { useState } from 'react';
import { 
    ShieldCheck, 
    Lock, 
    Search, 
    Plus, 
    ChevronRight, 
    Info, 
    CheckCircle2, 
    X,
    Loader2,
    Settings,
    FileText,
    Box,
    Wallet
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import { useRoles, useAttachPermissionToRole, useDetachPermissionFromRole } from '@/hooks/core/useRole';
import { usePermissions } from '@/hooks/core/usePermission';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CoreRolesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const { data: rolesData, isLoading: rolesLoading } = useRoles();
    const { data: permissionsData, isLoading: permsLoading } = usePermissions({ pageSize: 500 });
    
    const attachMutation = useAttachPermissionToRole();
    const detachMutation = useDetachPermissionFromRole();

    const roles = rolesData?.data || [];
    const permissions = permissionsData?.data || [];

    const selectedRole = roles.find(r => r.id === selectedRoleId) || roles[0];

    // Group permissions by module/category
    const groupedPermissions = permissions.reduce((acc: any, perm: any) => {
        const category = perm.code.split(':')[0] || 'Outros';
        if (!acc[category]) acc[category] = [];
        acc[category].push(perm);
        return acc;
    }, {});

    const categoryIcons: any = {
        invoice: <FileText size={14} />,
        billing: <FileText size={14} />,
        stock: <Box size={14} />,
        treasury: <Wallet size={14} />,
        user: <Settings size={14} />,
        role: <ShieldCheck size={14} />,
    };

    const handleTogglePermission = async (permId: string, isAssigned: boolean) => {
        if (!selectedRole) return;
        
        try {
            if (isAssigned) {
                await detachMutation.mutateAsync({ roleId: selectedRole.id, permissionId: permId });
                toast.success('Permissão removida');
            } else {
                await attachMutation.mutateAsync({ roleId: selectedRole.id, permissionId: permId });
                toast.success('Permissão atribuída');
            }
        } catch (err) {
            toast.error('Erro ao atualizar permissão');
        }
    };

    if (rolesLoading || permsLoading) {
        return (
            <div className="py-20 flex flex-col items-center gap-4 bg-white border border-slate-200 rounded-sm shadow-sm">
                <Loader2 size={40} className="text-primary animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando segurança...</p>
            </div>
        );
    }

    return (
        <div className="flex gap-8 h-[calc(100vh-200px)] animate-in fade-in duration-500 overflow-hidden">
            {/* Roles Sidebar */}
            <div className="w-80 shrink-0 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Funções & Cargos</h2>
                    <button className="text-primary hover:bg-primary/5 p-1 rounded-sm transition-all">
                        <Plus size={16} />
                    </button>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-sm overflow-y-auto flex-1 shadow-sm divide-y divide-slate-50 custom-scrollbar">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRoleId(role.id)}
                            className={cn(
                                "w-full text-left p-4 transition-all flex items-center justify-between group",
                                (selectedRoleId === role.id || (!selectedRoleId && role.id === roles[0]?.id))
                                    ? "bg-primary/[0.03] border-l-4 border-l-primary" 
                                    : "hover:bg-slate-50 border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-sm flex items-center justify-center border transition-colors",
                                    (selectedRoleId === role.id || (!selectedRoleId && role.id === roles[0]?.id))
                                        ? "bg-primary text-white border-primary"
                                        : "bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-white group-hover:text-primary"
                                )}>
                                    <Lock size={14} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{role.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{role.permissions?.length || 0} Permissões</p>
                                </div>
                            </div>
                            <ChevronRight size={14} className={cn(
                                "transition-transform",
                                (selectedRoleId === role.id || (!selectedRoleId && role.id === roles[0]?.id)) ? "text-primary translate-x-1" : "text-slate-200"
                            )} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Permissions Panel */}
            <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                {selectedRole ? (
                    <>
                        {/* Panel Header */}
                        <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center text-primary shadow-sm border border-slate-100">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Permissões de {selectedRole.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 italic">Configure o que esta função pode visualizar ou operar</p>
                                </div>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <Input 
                                    placeholder="Filtrar permissões..." 
                                    className="pl-9 h-9 text-xs bg-white border-slate-200"
                                />
                            </div>
                        </div>

                        {/* Permissions List */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {Object.keys(groupedPermissions).sort().map((category) => (
                                    <div key={category} className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                            <div className="w-6 h-6 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500">
                                                {categoryIcons[category.toLowerCase()] || <Settings size={12} />}
                                            </div>
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{category}</h4>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {groupedPermissions[category].map((perm: any) => {
                                                const isAssigned = !!selectedRole.permissions?.some((rp: any) => rp.permissionId === perm.id);
                                                return (
                                                    <div 
                                                        key={perm.id} 
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-sm border transition-all group",
                                                            isAssigned 
                                                                ? "bg-primary/[0.02] border-primary/20" 
                                                                : "bg-white border-slate-100 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className="flex-1 pr-4">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={cn(
                                                                    "text-[11px] font-black tracking-tight uppercase",
                                                                    isAssigned ? "text-primary" : "text-slate-700"
                                                                )}>
                                                                    {perm.name}
                                                                </span>
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 uppercase tracking-tighter">
                                                                    {perm.code}
                                                                </span>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 font-medium italic line-clamp-1">{perm.description || 'Sem descrição detalhada.'}</p>
                                                        </div>
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePermission(perm.id, isAssigned)}
                                                            className={cn(
                                                                "w-10 h-6 rounded-full relative transition-all duration-300",
                                                                isAssigned ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-slate-200"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm",
                                                                isAssigned ? "left-5" : "left-1"
                                                            )} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Footer Info */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2 text-slate-400 italic">
                                <Info size={14} />
                                <span>Alterações são aplicadas imediatamente a todos os utilizadores com esta função.</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="font-bold text-slate-600 uppercase tracking-tighter">Permitido</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                    <span className="font-bold text-slate-600 uppercase tracking-tighter">Negado</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-50">
                        <ShieldCheck size={64} className="text-slate-200 mb-6" />
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Selecione uma Função</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-2">Escolha uma função à esquerda para gerenciar os seus níveis de acesso.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
