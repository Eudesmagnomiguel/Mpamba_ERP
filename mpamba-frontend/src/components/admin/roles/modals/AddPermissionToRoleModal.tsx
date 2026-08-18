'use client';

import React, { useState, useMemo } from 'react';
import { 
    X, 
    Search, 
    Shield, 
    Plus, 
    Loader2,
    ShieldCheck,
} from 'lucide-react';

interface Permission {
    id: string;
    code: string;
    description?: string | null;
}

interface AddPermissionToRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleId: string | null;
    roleName?: string;
    availablePermissions: Permission[];
    onAdd: (permissionId: string) => Promise<void>;
    isPending: boolean;
}

export default function AddPermissionToRoleModal({
    isOpen,
    onClose,
    roleId,
    roleName,
    availablePermissions,
    onAdd,
    isPending
}: AddPermissionToRoleModalProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPermissions = useMemo(() => {
        return availablePermissions.filter(p => 
            p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [availablePermissions, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white w-full max-w-sm rounded-sm shadow-2xl flex flex-col h-[550px] max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center">
                            <Plus size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Adicionar Permissão</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                Atribuindo ao papel: <span className="text-primary">{roleName}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-sm transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Pesquisar por código ou descrição..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Permissions List */}
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {filteredPermissions.length === 0 ? (
                        <div className="py-12 text-center">
                            <Shield size={32} className="text-slate-200 mx-auto mb-3" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {searchTerm ? 'Nenhuma permissão encontrada' : 'Todas as permissões já atribuídas'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            {filteredPermissions.map((perm) => (
                                <button
                                    key={perm.id}
                                    onClick={() => !isPending && onAdd(perm.id)}
                                    disabled={isPending}
                                    className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-slate-50 text-left transition-all border border-transparent hover:border-slate-100 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">{perm.code}</p>
                                            {perm.description && (
                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">{perm.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus size={14} className="text-primary" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {filteredPermissions.length} resultados
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>

            {/* Loading Overlay for Actions */}
            {isPending && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[60] backdrop-blur-[1px]">
                    <div className="bg-white p-4 rounded-sm shadow-lg flex items-center gap-3 border border-slate-200">
                        <Loader2 size={20} className="text-primary animate-spin" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Adicionando...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
