'use client';

import React from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteModalProps {
    isOpen: boolean;
    title?: string;
    description?: string;
    itemName: string;
    itemType?: string; // ex: "Papel", "Usuário", "Organização"
    onConfirm: () => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
    isDangerous?: boolean; // Mostra em vermelho se true
}

export default function DeleteModal({
    isOpen,
    title,
    description,
    itemName,
    itemType = 'item',
    onConfirm,
    onClose,
    isLoading = false,
    isDangerous = true,
}: DeleteModalProps) {
    const handleConfirm = async () => {
        await onConfirm();
    };

    if (!isOpen) return null;

    const defaultTitle = isDangerous ? `Deletar ${itemType}` : `Remover ${itemType}`;
    const defaultDescription = isDangerous 
        ? 'Esta ação não pode ser desfeita' 
        : 'Tem certeza que deseja remover?';

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-sm shadow-2xl border border-slate-200 w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-sm ${isDangerous ? 'bg-red-50' : 'bg-amber-50'}`}>
                                <Trash2 size={20} className={isDangerous ? 'text-red-600' : 'text-amber-600'} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{title || defaultTitle}</h2>
                                <p className={`text-xs ${isDangerous ? 'text-slate-500' : 'text-slate-500'} mt-0.5`}>
                                    {description || defaultDescription}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-all disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                        {/* Warning Box */}
                        <div className={`${isDangerous ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} border rounded-sm p-4 flex gap-3`}>
                            <AlertTriangle size={20} className={`${isDangerous ? 'text-red-600' : 'text-amber-600'} flex-shrink-0 mt-0.5`} />
                            <div>
                                <p className={`text-sm font-bold ${isDangerous ? 'text-red-900' : 'text-amber-900'}`}>
                                    Tem certeza que deseja {isDangerous ? 'deletar' : 'remover'}?
                                </p>
                                <p className={`text-xs ${isDangerous ? 'text-red-700' : 'text-amber-700'} mt-1`}>
                                    O {itemType.toLowerCase()} <strong>"{itemName}"</strong> será permanentemente {isDangerous ? 'removido do sistema' : 'retirado'}.
                                </p>
                            </div>
                        </div>

                        {/* Additional message for dangerous operations */}
                        {isDangerous && (
                            <p className="text-sm text-slate-600">
                                Se este {itemType.toLowerCase()} está atribuído a outros registros, considere remover as atribuições antes.
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 p-6 border-t border-slate-200 bg-slate-50">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 text-white font-bold text-sm rounded-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${
                                isDangerous 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {isDangerous ? 'Deletando...' : 'Removendo...'}
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} />
                                    {isDangerous ? `Deletar ${itemType}` : `Remover ${itemType}`}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
