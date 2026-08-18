'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PermissionForm from '@/components/admin/permissions/PermissionForm';
import { usePermission, useUpdatePermission } from '@/hooks/core/usePermission';
import { CreatePermissionDto } from '@/shared/dto/permission.dto';

interface EditPermissionModalProps {
    isOpen: boolean;
    permissionId?: string | null;
    onClose: () => void;
}

export default function EditPermissionModal({ isOpen, permissionId, onClose }: EditPermissionModalProps) {
    const { data: permission, isLoading } = usePermission(permissionId as string);
    const updateMutation = useUpdatePermission();

    const handleSubmit = async (data: CreatePermissionDto) => {
        try {
            await updateMutation.mutateAsync({ id: permissionId as string, data });
            toast.success('Permissão atualizada com sucesso!');
            onClose();
        } catch (error: any) {
            console.error('Error updating permission:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao atualizar a permissão.';
            toast.error(message);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-sm shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-sm">
                                <Loader2 size={20} className="text-slate-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Editar Permissão</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Atualize os dados da permissão</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-sm">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin text-primary" />
                            </div>
                        ) : (
                            <PermissionForm initialData={permission ? { ...permission, description: permission.description ?? undefined } : undefined} onSubmit={handleSubmit} isLoading={updateMutation.isPending} isEdit onCancel={onClose} />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
