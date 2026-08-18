'use client';

import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Package, DollarSign, Calendar, Palette } from 'lucide-react';
import { PlanDTO, PlanSchema } from '@/shared/dto/plan.dto';
import FormInput from '@/components/common/forms/Input';
import FormButton from '@/components/common/forms/Button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PlanFormProps {
    initialData?: Partial<PlanDTO>;
    onSubmit: (data: PlanDTO) => void;
    isLoading?: boolean;
}

export default function PlanForm({ initialData, onSubmit, isLoading }: PlanFormProps) {
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<PlanDTO>({
        resolver: zodResolver(PlanSchema),
        defaultValues: {
            name: initialData?.name || '',
            price: initialData?.price || '',
            cycle: initialData?.cycle || 'Mensal',
            features: initialData?.features || [''],
            status: initialData?.status || 'Ativo',
            color: initialData?.color || 'bg-primary',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'features' as never,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info Card */}
                <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Package size={18} className="text-primary" />
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Informações Básicas</h3>
                    </div>

                    <FormInput
                        label="Nome do Plano"
                        placeholder="Ex: Professional, Enterprise..."
                        {...register('name')}
                        error={errors.name?.message}
                        icon={<Package size={18} />}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput
                            label="Preço"
                            placeholder="Ex: Kz 45,000"
                            {...register('price')}
                            error={errors.price?.message}
                            icon={<DollarSign size={18} />}
                        />

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-foreground">Ciclo de Facturação</label>
                            <Controller
                                name="cycle"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger
                                            className={cn(
                                                "h-11 w-full rounded-sm border-2 bg-slate-50 px-4 text-sm font-medium text-foreground",
                                                errors.cycle ? "border-red-500" : "border-gray-200"
                                            )}
                                        >
                                            <SelectValue placeholder="Selecione o ciclo" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm">
                                            <SelectItem value="Mensal">Mensal</SelectItem>
                                            <SelectItem value="Anual">Anual</SelectItem>
                                            <SelectItem value="14 Dias">14 Dias (Trial)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.cycle && <p className="text-xs font-bold text-red-600 mt-1">● {errors.cycle.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-foreground">Cor de Identificação</label>
                            <Controller
                                name="color"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-11 w-full rounded-sm border-2 bg-slate-50 px-4 text-sm font-medium text-foreground border-gray-200">
                                            <SelectValue placeholder="Selecione a cor" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm">
                                            <SelectItem value="bg-primary">Azul-marinho (Marca)</SelectItem>
                                            <SelectItem value="bg-blue-500">Azul</SelectItem>
                                            <SelectItem value="bg-emerald-500">Verde</SelectItem>
                                            <SelectItem value="bg-amber-500">Laranja</SelectItem>
                                            <SelectItem value="bg-slate-900">Preto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-foreground">Status Inicial</label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-11 w-full rounded-sm border-2 bg-slate-50 px-4 text-sm font-medium text-foreground border-gray-200">
                                            <SelectValue placeholder="Selecione o estado" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm">
                                            <SelectItem value="Ativo">Ativo</SelectItem>
                                            <SelectItem value="Inativo">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Features Card */}
                <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Plus size={18} className="text-primary" />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Funcionalidades</h3>
                        </div>
                        <button 
                            type="button"
                            onClick={() => append('')}
                            className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-sm hover:bg-primary/20 transition-all uppercase"
                        >
                            Adicionar Item
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                                <FormInput
                                    placeholder="Descreva a funcionalidade..."
                                    {...register(`features.${index}` as const)}
                                    wrapperClassName="flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all border-2 border-transparent"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {errors.features && <p className="text-xs font-bold text-red-600">● {errors.features.message}</p>}
                </div>
            </div>

            <div className="flex gap-4 border-t border-slate-100 pt-8">
                <FormButton 
                    type="button"
                    fullWidth={true}
                    className="bg-slate-200 text-slate-700 hover:bg-slate-300"
                    onClick={() => window.history.back()}
                >
                    Cancelar
                </FormButton>
                <FormButton 
                    type="submit"
                    fullWidth={true}
                    isLoading={isLoading}
                    loadingText="Salvando..."
                >
                    Salvar
                </FormButton>
            </div>
        </form>
    );
}
