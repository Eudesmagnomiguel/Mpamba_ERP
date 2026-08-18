'use client';

import React from 'react';
import { X, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ModuleForm from '@/components/admin/modules/ModuleForm';
import { useCreateModule } from '@/hooks/core/useModule';
import { CreateModuleDto } from '@/shared/dto/module.dto';

interface CreateModuleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateModuleModal({ isOpen, onClose }: CreateModuleModalProps) {
    const createModuleMutation = useCreateModule();

    const handleSubmit = async (data: CreateModuleDto) => {
        try {
            await createModuleMutation.mutateAsync(data);
            toast.success('Módulo criado com sucesso!');
            onClose();
        } catch (error: any) {
            console.error('Error creating module:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao criar o módulo.';
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
                                <Package size={20} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Criar Novo Módulo</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Adicione um novo módulo ao sistema</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <ModuleForm 
                            onSubmit={handleSubmit}
                            isLoading={createModuleMutation.isPending}
                            onCancel={onClose}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
