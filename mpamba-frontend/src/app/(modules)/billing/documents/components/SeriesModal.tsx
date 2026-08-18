'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    X,
    Save,
    Loader2,
    AlertCircle,
    Trash2,
    Calendar,
    Hash,
    Layers
} from 'lucide-react';
import { toast } from 'sonner';
import {
    CreateSeriesSchema,
    CreateSeriesDto,
    UpdateSeriesDto
} from '@/shared/dto/billing.dto';
import {
    useCreateBillingSeries,
    useUpdateBillingSeries,
    useDeleteBillingSeries
} from '@/hooks/module/billing';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import FormSelect from '@/components/common/forms/Select';
import { cn } from '@/lib/utils';

const PREFIX_OPTIONS = [
    { value: 'FT', label: 'FT — Faturas' },
    { value: 'RC', label: 'RC — Recibos' },
    { value: 'PF', label: 'PF — Proformas' },
    { value: 'NC', label: 'NC — Notas de Crédito' },
];

interface SeriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    series?: any; // If provided, we are editing
}

export default function SeriesModal({ isOpen, onClose, series }: SeriesModalProps) {
    const isEditing = !!series;
    const { mutate: createSeries, isPending: isCreating } = useCreateBillingSeries();
    const { mutate: updateSeries, isPending: isUpdating } = useUpdateBillingSeries();
    const { mutate: deleteSeries, isPending: isDeleting } = useDeleteBillingSeries();

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<CreateSeriesDto>({
        resolver: zodResolver(CreateSeriesSchema),
        defaultValues: {
            prefix: '',
            year: new Date().getFullYear(),
            nextSequence: 1,
            isActive: true
        }
    });

    useEffect(() => {
        if (series) {
            reset({
                prefix: series.prefix,
                year: series.year,
                nextSequence: series.nextSequence,
                isActive: series.isActive
            });
        } else {
            reset({
                prefix: '',
                year: new Date().getFullYear(),
                nextSequence: 1,
                isActive: true
            });
        }
    }, [series, reset]);

    const onSubmit = (data: CreateSeriesDto) => {
        if (isEditing) {
            updateSeries({ id: series.id, data }, {
                onSuccess: () => {
                    toast.success('Série atualizada com sucesso');
                    onClose();
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || 'Erro ao atualizar série');
                }
            });
        } else {
            createSeries(data, {
                onSuccess: () => {
                    toast.success('Série criada com sucesso');
                    onClose();
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || 'Erro ao criar série');
                }
            });
        }
    };

    const handleDelete = () => {
        if (!series?.id) return;
        
        if (confirm('Tem certeza que deseja remover esta série? Esta ação não pode ser desfeita se houver documentos associados.')) {
            deleteSeries(series.id, {
                onSuccess: () => {
                    toast.success('Série removida com sucesso');
                    onClose();
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || 'Não é possível remover séries com documentos emitidos.');
                }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-sm shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-primary px-6 py-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-sm">
                            <Layers size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest">
                                {isEditing ? 'Editar Série' : 'Nova Série Fiscal'}
                            </h2>
                            <p className="text-[10px] text-white/60 font-bold uppercase mt-0.5">Configuração de numeração</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Controller
                                    name="prefix"
                                    control={control}
                                    render={({ field }) => (
                                        <FormSelect
                                            label="Prefixo"
                                            placeholder="Selecione o tipo de documento"
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            error={errors.prefix?.message}
                                            disabled={isEditing}
                                            options={PREFIX_OPTIONS}
                                        />
                                    )}
                                />
                                {isEditing && (
                                    <p className="text-[9px] text-slate-400 font-medium italic">O prefixo não pode ser alterado após a criação da série.</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ano Fiscal</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <Input 
                                        type="number"
                                        {...register('year', { valueAsNumber: true })}
                                        className="pl-10 h-11 border-slate-200 font-bold text-sm"
                                    />
                                </div>
                                {errors.year && <p className="text-[10px] text-rose-500 font-bold">{errors.year.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próxima Sequência</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <Input 
                                    type="number"
                                    {...register('nextSequence', { valueAsNumber: true })}
                                    className="pl-10 h-11 border-slate-200 font-bold text-sm"
                                    placeholder="1"
                                />
                            </div>
                            {errors.nextSequence && <p className="text-[10px] text-rose-500 font-bold">{errors.nextSequence.message}</p>}
                            <p className="text-[9px] text-slate-400 font-medium italic">A sequência será incrementada automaticamente a cada documento emitido.</p>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-sm">
                            <input 
                                type="checkbox"
                                id="isActive"
                                {...register('isActive')}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="isActive" className="text-xs font-bold text-slate-600 select-none cursor-pointer uppercase tracking-tight">
                                Série Ativa para emissão
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                        <Button 
                            type="submit" 
                            disabled={isCreating || isUpdating}
                            className="h-12 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest rounded-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            {isCreating || isUpdating ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Save size={18} />
                            )}
                            {isEditing ? 'Guardar Alterações' : 'Criar Série'}
                        </Button>

                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="h-12 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-black uppercase tracking-widest rounded-sm text-[10px] transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                                Remover Série
                            </button>
                        )}
                        
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest py-2"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
