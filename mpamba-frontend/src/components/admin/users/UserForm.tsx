'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    User, 
    Mail, 
    LockKeyhole, 
    Building2, 
    Shield, 
    CheckCircle2, 
    XCircle,
    Save,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CreateUserSchema, CreateUserDto } from '@/shared/dto/user.dto';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { useOrganizations } from '@/hooks/module/organization';
import { useRoles } from '@/hooks/core/useRole';
import { cn } from '@/lib/utils';

interface UserFormProps {
    initialData?: Partial<CreateUserDto>;
    onSubmit: (data: CreateUserDto) => Promise<void>;
    isLoading?: boolean;
    isEdit?: boolean;
}

export default function UserForm({ initialData, onSubmit, isLoading, isEdit }: UserFormProps) {
    const router = useRouter();
    const { data: orgsData, isLoading: isLoadingOrgs } = useOrganizations();
    const { data: rolesData, isLoading: isLoadingRoles } = useRoles();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateUserDto>({
        resolver: zodResolver(CreateUserSchema),
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            password: initialData?.password || '',
            organizationId: initialData?.organizationId || undefined,
            roleIds: initialData?.roleIds || [],
            isActive: initialData?.isActive ?? true,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome Completo */}
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Nome Completo"
                            placeholder="Ex: Emanuel Malungo"
                            icon={<User size={16} />}
                            error={errors.name?.message}
                            disabled={isLoading}
                        />
                    )}
                />

                {/* Email */}
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Endereço de Email"
                            type="email"
                            placeholder="Ex: emanuel@mpamba.com"
                            icon={<Mail size={16} />}
                            error={errors.email?.message}
                            disabled={isLoading}
                        />
                    )}
                />

                {/* Senha - Apenas se não for edição ou se quiser trocar */}
                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={isEdit ? "Nova Senha (opcional)" : "Senha de Acesso"}
                            type="password"
                            placeholder="••••••••"
                            icon={<LockKeyhole size={16} />}
                            showPasswordToggle
                            error={errors.password?.message}
                            disabled={isLoading}
                        />
                    )}
                />

                {/* Organização */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                        Organização
                    </label>
                    <Controller
                        name="organizationId"
                        control={control}
                        render={({ field }) => (
                            <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={isLoading || isLoadingOrgs}
                            >
                                <SelectTrigger className="w-full bg-white border-slate-200 rounded-sm h-11 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-slate-400" />
                                        <SelectValue placeholder="Selecione a organização" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-sm shadow-xl border-slate-200">
                                    <SelectItem value="none">SISTEMA (Global)</SelectItem>
                                    {orgsData?.data?.map((org: any) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.organizationId && (
                        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                            <span>●</span> {errors.organizationId.message}
                        </p>
                    )}
                </div>

                {/* Papel / Role */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                        Papel / Cargo
                    </label>
                    <Controller
                        name="roleIds"
                        control={control}
                        render={({ field }) => (
                            <Select 
                                onValueChange={(val) => field.onChange([val])} 
                                defaultValue={field.value?.[0]}
                                disabled={isLoading || isLoadingRoles}
                            >
                                <SelectTrigger className="w-full bg-white border-slate-200 rounded-sm h-11 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Shield size={16} className="text-slate-400" />
                                        <SelectValue placeholder="Atribuir papel" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-sm shadow-xl border-slate-200">
                                    {rolesData?.data?.map((role: any) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.roleIds && (
                        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                            <span>●</span> {errors.roleIds.message}
                        </p>
                    )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                        Status da Conta
                    </label>
                    <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-4 h-11 px-4 bg-slate-50 border border-slate-200 rounded-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        className="sr-only"
                                        checked={field.value === true}
                                        onChange={() => field.onChange(true)}
                                    />
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                        field.value === true ? "border-primary bg-primary" : "border-slate-300 group-hover:border-primary/50"
                                    )}>
                                        {field.value === true && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className={cn("text-sm font-bold", field.value === true ? "text-slate-900" : "text-slate-500")}>Ativo</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        className="sr-only"
                                        checked={field.value === false}
                                        onChange={() => field.onChange(false)}
                                    />
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                        field.value === false ? "border-red-500 bg-red-500" : "border-slate-300 group-hover:border-red-300"
                                    )}>
                                        {field.value === false && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className={cn("text-sm font-bold", field.value === false ? "text-slate-900" : "text-slate-500")}>Inativo</span>
                                </label>
                            </div>
                        )}
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                <Button 
                    type="button" 
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 text-slate-700 font-bold text-sm rounded-sm hover:bg-slate-300 disabled:opacity-50 transition-all"
                >
                    <X size={16} />
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    isLoading={isLoading}
                    className="flex-1 flex items-center justify-center gap-2"
                >
                    <Save size={16} />
                    {isEdit ? "Salvar" : "Criar"}
                </Button>
            </div>
        </form>
    );
}
