'use client';

import React, { useState } from 'react';
import {
    Plus,
    Search,
    Settings,
    CreditCard,
    BarChart3,
    Zap,
    Box,
    Loader2
} from 'lucide-react';
import { useModules } from '@/hooks/core/useModule';
import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import CreateModuleModal from '@/components/admin/modules/modals/CreateModuleModal';
import EditModuleModal from '@/components/admin/modules/modals/EditModuleModal';

export default function ModulesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

    const { data: modulesData, isLoading, isError } = useModules();

    const user = useAuthStore(state => state.user);
    const hasModuleCreate = user?.permissions?.includes(PERMISSIONS.MODULE_CREATE);
    const hasModuleUpdate = user?.permissions?.includes(PERMISSIONS.MODULE_UPDATE);

    const modules = modulesData?.data?.filter(mod =>
        mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mod.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getModuleIcon = (code: string) => {
        switch (code.toLowerCase()) {
            case 'faturacao': return CreditCard;
            case 'tesouraria': return BarChart3;
            case 'stock': return Box;
            default: return Zap;
        }
    };

    const handleOpenEditModal = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setIsEditModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedModuleId(null);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catálogo de Módulos</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Ative e configure os módulos disponíveis para o ecossistema Mpamba.</p>
                </div>

                {hasModuleCreate && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary/90 transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        Criar Novo Módulo
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
                        placeholder="Pesquisar módulo por nome ou código..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Modules Grid */}
            {isLoading ? (
                <div className="py-20 flex flex-col items-center gap-3">
                    <Loader2 size={40} className="text-primary animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando módulos...</p>
                </div>
            ) : isError ? (
                <div className="py-20 text-center text-red-500 font-bold">
                    Erro ao carregar módulos.
                </div>
            ) : modules.length === 0 ? (
                <div className="py-20 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum módulo encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {modules.map((module) => {
                        const Icon = getModuleIcon(module.code);
                        return (
                            <div key={module.id} className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm hover:border-primary/40 transition-all group flex flex-col">
                                <div className="p-6 flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 rounded-sm bg-slate-50 border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all text-primary">
                                            <Icon size={24} />
                                        </div>
                                        <div className="px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            Ativo
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">{module.name}</h3>
                                            <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-sm uppercase">{module.code}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            {module.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    {hasModuleUpdate && (
                                        <button
                                            onClick={() => handleOpenEditModal(module.id)}
                                            className="text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1.5"
                                        >
                                            <Settings size={14} />
                                            Editar
                                        </button>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer bg-primary">
                                            <span className="inline-block h-3 w-3 rounded-full bg-white transition transform translate-x-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Modals */}
            <CreateModuleModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModals}
            />
            <EditModuleModal
                isOpen={isEditModalOpen}
                moduleId={selectedModuleId}
                onClose={handleCloseModals}
            />        
        </div>
    );
}
