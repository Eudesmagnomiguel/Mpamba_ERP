'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Save, X } from 'lucide-react';
import { CreatePermissionSchema, CreatePermissionDto } from '@/shared/dto/permission.dto';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { cn } from '@/lib/utils';

interface PermissionFormProps {
    initialData?: Partial<CreatePermissionDto>;
    onSubmit: (data: CreatePermissionDto) => Promise<void>;
    isLoading?: boolean;
    isEdit?: boolean;
    onCancel?: () => void;
}

export default function PermissionForm({ initialData, onSubmit, isLoading, isEdit, onCancel }: PermissionFormProps) {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePermissionDto>({
        resolver: zodResolver(CreatePermissionSchema),
        defaultValues: {
            code: initialData?.code || '',
            description: initialData?.description || '',
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Controller
                name="code"
                control={control}
                render={({ field }) => (
                    <Input
                        {...field}
                        label="Código"
                        placeholder="module:action (ex: user:view)"
                        icon={<FileText size={16} />}
                        error={errors.code?.message}
                        disabled={isLoading}
                    />
                )}
            />

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">Descrição</label>
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-slate-400">
                                <FileText size={16} />
                            </div>
                            <textarea
                                {...field}
                                placeholder="Descrição da permissão"
                                disabled={isLoading}
                                className={cn(
                                    "w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-sm",
                                    "text-sm text-slate-900 placeholder-slate-400",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                    "transition-all duration-200 resize-none h-24",
                                    "disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
                                )}
                            />
                        </div>
                    )}
                />
                {errors.description && (
                    <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">{errors.description.message}</p>
                )}
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold text-sm rounded-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                    <Save size={16} />
                    {isEdit ? 'Atualizar' : 'Criar'}
                </Button>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                    <X size={16} />
                    Cancelar
                </button>
            </div>
        </form>
    );
}
