'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    Lock,
    FileText,
    Save,
    X
} from 'lucide-react';
import { CreateRoleSchema, CreateRoleDto } from '@/shared/dto/role.dto';
import { useModules } from '@/hooks/core/useModule';
import { usePermissions } from '@/hooks/core/usePermission';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { cn } from '@/lib/utils';

interface RoleFormProps {
    initialData?: Partial<CreateRoleDto>;
    onSubmit: (data: CreateRoleDto) => Promise<void>;
    isLoading?: boolean;
    isEdit?: boolean;
    onCancel?: () => void;
}

export default function RoleForm({ initialData, onSubmit, isLoading, isEdit, onCancel }: RoleFormProps) {
    const { data: modulesData } = useModules();
    const modules = modulesData?.data || [];
    const { data: permissionsData } = usePermissions({ pageSize: 500 });
    const permissions = permissionsData?.data || [];

    // Agrupar permissões pelo prefixo do código (ex.: "stock:product:view" -> "stock")
    const groupedPermissions = permissions.reduce((acc: Record<string, any[]>, perm: any) => {
        const group = perm.code.split(':')[0] || 'outros';
        if (!acc[group]) acc[group] = [];
        acc[group].push(perm);
        return acc;
    }, {});

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateRoleDto>({
        resolver: zodResolver(CreateRoleSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            organizationId: initialData?.organizationId || undefined,
            moduleId: initialData?.moduleId || undefined,
            permissionIds: initialData?.permissionIds || [],
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Module select */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">Módulo</label>
                <Controller
                    name="moduleId"
                    control={control}
                    render={({ field }) => {
                        return (
                            <select
                                {...field}
                                disabled={isLoading}
                                className={cn(
                                    'w-full bg-white border border-slate-200 rounded-sm py-2 px-3 text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                                )}
                            >
                                <option value="">-- Nenhum --</option>
                                {modules.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                                ))}
                            </select>
                        );
                    }}
                />
            </div>
            {/* Nome da Função */}
            <Controller
                name="name"
                control={control}
                render={({ field }) => (
                    <Input
                        {...field}
                        label="Nome do Papel"
                        placeholder="Ex: Gerente Financeiro"
                        icon={<Lock size={16} />}
                        error={errors.name?.message}
                        disabled={isLoading}
                    />
                )}
            />

            {/* Descrição */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Descrição
                </label>
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
                                placeholder="Descreva o propósito e responsabilidades deste papel..."
                                disabled={isLoading}
                                className={cn(
                                    "w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-sm",
                                    "text-sm text-slate-900 placeholder-slate-400",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                    "transition-all duration-200 resize-none h-32",
                                    "disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
                                )}
                            />
                        </div>
                    )}
                />
                {errors.description && (
                    <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                        <span>●</span> {errors.description.message}
                    </p>
                )}
            </div>

            {/* Permissões */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Permissões
                </label>
                <p className="text-xs text-slate-400 -mt-1">
                    Selecione o que este papel pode visualizar ou operar. Sem permissões marcadas, os utilizadores com este papel não conseguem aceder a nenhuma funcionalidade.
                </p>
                <Controller
                    name="permissionIds"
                    control={control}
                    render={({ field }) => {
                        const selected = new Set(field.value || []);
                        const toggle = (id: string) => {
                            const next = new Set(selected);
                            next.has(id) ? next.delete(id) : next.add(id);
                            field.onChange(Array.from(next));
                        };
                        return (
                            <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                {Object.keys(groupedPermissions).length === 0 ? (
                                    <p className="text-xs text-slate-400 px-3 py-3">Nenhuma permissão disponível.</p>
                                ) : (
                                    Object.entries(groupedPermissions).map(([group, perms]) => (
                                        <div key={group} className="p-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{group}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                {perms.map((perm: any) => (
                                                    <label
                                                        key={perm.id}
                                                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-slate-50 cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="w-3.5 h-3.5 accent-primary cursor-pointer shrink-0"
                                                            checked={selected.has(perm.id)}
                                                            onChange={() => toggle(perm.id)}
                                                            disabled={isLoading}
                                                        />
                                                        <span className="text-xs text-slate-700 truncate" title={perm.code}>{perm.code}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        );
                    }}
                />
            </div>

            {/* Botões de Ação */}
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
