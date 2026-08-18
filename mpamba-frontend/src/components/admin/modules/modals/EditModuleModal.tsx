'use client';

import React from 'react';
import { X, Package, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ModuleForm from '@/components/admin/modules/ModuleForm';
import { useModule, useUpdateModule } from '@/hooks/core/useModule';
import { UpdateModuleDto } from '@/shared/dto/module.dto';

interface EditModuleModalProps {
    isOpen: boolean;
    moduleId: string | null;
    onClose: () => void;
}

export default function EditModuleModal({ isOpen, moduleId, onClose }: EditModuleModalProps) {
    const { data: moduleData, isLoading: isLoadingModule } = useModule(moduleId || '');
    const updateModuleMutation = useUpdateModule();

    const handleSubmit = async (data: any) => {
        if (!moduleId) return;
        
        try {
            const payload: UpdateModuleDto = { ...data };
            await updateModuleMutation.mutateAsync({ id: moduleId, data: payload });
            toast.success('Módulo atualizado com sucesso!');
            onClose();
        } catch (error: any) {
            console.error('Error updating module:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao atualizar o módulo.';
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
                                <h2 className="text-lg font-bold text-slate-900">Editar Módulo</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {moduleData ? `Atualizando: ${moduleData.name}` : 'Carregando dados...'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoadingModule || updateModuleMutation.isPending}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-all disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {isLoadingModule ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 size={40} className="text-primary animate-spin" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando módulo...</p>
                            </div>
                        ) : !moduleData ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <AlertCircle size={40} className="text-red-600" />
                                <p className="text-sm font-bold text-slate-900 uppercase">Módulo não encontrado</p>
                            </div>
                        ) : (
                            <ModuleForm 
                                initialData={{
                                    ...moduleData,
                                    description: moduleData.description || ''
                                }}
                                onSubmit={handleSubmit}
                                isLoading={updateModuleMutation.isPending}
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
