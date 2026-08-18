'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    Building2, 
    Hash, 
    MapPin, 
    Phone, 
    Mail, 
    CreditCard, 
    Save, 
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CreateOrganizationSchema, CreateOrganizationDto } from '@/shared/dto/organization.dto';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { usePlans } from '@/hooks/core/usePlan';
import { cn } from '@/lib/utils';

interface OrganizationFormProps {
    initialData?: Partial<CreateOrganizationDto>;
    onSubmit: (data: CreateOrganizationDto) => Promise<void>;
    isLoading?: boolean;
    isEdit?: boolean;
}

export default function OrganizationForm({ initialData, onSubmit, isLoading, isEdit }: OrganizationFormProps) {
    const router = useRouter();
    const { data: plansData, isLoading: isLoadingPlans } = usePlans();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateOrganizationDto>({
        resolver: zodResolver(CreateOrganizationSchema),
        defaultValues: {
            name: initialData?.name || '',
            nif: initialData?.nif || '',
            address: initialData?.address || '',
            phone: initialData?.phone || '',
            email: initialData?.email || '',
            planId: initialData?.planId || undefined,
            isActive: initialData?.isActive ?? true,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome da Organização */}
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Nome da Organização"
                            placeholder="Ex: Mpamba Tech"
                            icon={<Building2 size={16} />}
                            error={errors.name?.message}
                            disabled={isLoading}
                        />
                    )}
                />

                {/* NIF */}
                <Controller
                    name="nif"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="NIF / Identificação Fiscal"
                            placeholder="Ex: 500123456"
                            icon={<Hash size={16} />}
                            error={errors.nif?.message}
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
                            label="Email de Contato"
                            type="email"
                            placeholder="Ex: contato@empresa.com"
                            icon={<Mail size={16} />}
                            error={errors.email?.message}
                            disabled={isLoading}
                        />
                    )}
                />

                {/* Telefone */}
                <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Telefone"
                            placeholder="Ex: +244 923 000 000"
                            icon={<Phone size={16} />}
                            error={errors.phone?.message}
                            disabled={isLoading}
                        />
                    )}
                />

                {/* Endereço */}
                <div className="md:col-span-2">
                    <Controller
                        name="address"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Endereço Completo"
                                placeholder="Rua, Número, Bairro, Cidade"
                                icon={<MapPin size={16} />}
                                error={errors.address?.message}
                                disabled={isLoading}
                            />
                        )}
                    />
                </div>

                {/* Plano de Subscrição */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                        Plano de Subscrição
                    </label>
                    <Controller
                        name="planId"
                        control={control}
                        render={({ field }) => (
                            <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={isLoading || isLoadingPlans}
                            >
                                <SelectTrigger className="w-full bg-white border-slate-200 rounded-sm h-11 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={16} className="text-slate-400" />
                                        <SelectValue placeholder="Selecione um plano" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-sm shadow-xl border-slate-200">
                                    {plansData?.data?.map((plan: any) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {plan.name} - {plan.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.planId && (
                        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                            <span>●</span> {errors.planId.message}
                        </p>
                    )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                        Status da Entidade
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
