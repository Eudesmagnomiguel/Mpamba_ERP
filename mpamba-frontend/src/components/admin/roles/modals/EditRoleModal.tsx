'use client';

import React from 'react';
import { X, Edit3, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import RoleForm from '@/components/admin/roles/RoleForm';
import { useRole, useUpdateRole } from '@/hooks/core/useRole';
import { CreateRoleDto, UpdateRoleDto } from '@/shared/dto/role.dto';
import type { RolePermission } from '@/shared/types/models';

interface EditRoleModalProps {
    isOpen: boolean;
    roleId: string | null;
    onClose: () => void;
}

export default function EditRoleModal({ isOpen, roleId, onClose }: EditRoleModalProps) {
    const { data: roleData, isLoading: isLoadingRole } = useRole(roleId || '');
    const updateRoleMutation = useUpdateRole();

    const handleSubmit = async (data: CreateRoleDto) => {
        if (!roleId) return;
        
        try {
            const payload: UpdateRoleDto = { ...data };
            await updateRoleMutation.mutateAsync({ id: roleId, data: payload });
            toast.success('Papel atualizado com sucesso!');
            onClose();
        } catch (error: any) {
            console.error('Error updating role:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao atualizar o papel.';
            toast.error(message);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-sm shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 rounded-sm">
                                <Edit3 size={20} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Editar Papel</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {roleData ? `Atualizando: ${roleData.name}` : 'Carregando dados...'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoadingRole || updateRoleMutation.isPending}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-all disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {isLoadingRole ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 size={40} className="text-primary animate-spin" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando papel...</p>
                            </div>
                        ) : !roleData ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <AlertCircle size={40} className="text-red-600" />
                                <p className="text-sm font-bold text-slate-900 uppercase">Papel não encontrado</p>
                                <p className="text-xs text-slate-500 text-center mt-2">O papel pode ter sido deletado ou você não tem permissão para acessá-lo.</p>
                                <button
                                    onClick={onClose}
                                    className="mt-4 px-4 py-2 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary/90"
                                >
                                    Fechar
                                </button>
                            </div>
                        ) : (
                            <RoleForm 
                                initialData={{
                                    name: roleData.name,
                                    description: roleData.description ?? undefined,
                                    organizationId: roleData.organizationId,
                                    moduleId: roleData.moduleId ?? undefined,
                                    permissionIds: roleData.permissions?.map((permission: RolePermission) => permission.permissionId) || [],
                                }}
                                onSubmit={handleSubmit}
                                isLoading={updateRoleMutation.isPending}
                                isEdit
                                onCancel={onClose}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
