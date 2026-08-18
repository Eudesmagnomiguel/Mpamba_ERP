'use client';

import React from 'react';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import PermissionForm from '@/components/admin/permissions/PermissionForm';
import { useCreatePermission } from '@/hooks/core/usePermission';
import { CreatePermissionDto } from '@/shared/dto/permission.dto';

interface CreatePermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreatePermissionModal({ isOpen, onClose }: CreatePermissionModalProps) {
    const createMutation = useCreatePermission();

    const handleSubmit = async (data: CreatePermissionDto) => {
        try {
            await createMutation.mutateAsync(data);
            toast.success('Permissão criada com sucesso!');
            onClose();
        } catch (error: any) {
            console.error('Error creating permission:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao criar a permissão.';
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
                            <div className="p-2 bg-primary/5 rounded-sm">
                                <Plus size={20} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Criar Permissão</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Defina um novo código de permissão</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-sm">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <PermissionForm onSubmit={handleSubmit} isLoading={createMutation.isPending} onCancel={onClose} />
                    </div>
                </div>
            </div>
        </>
    );
}
