'use client';

import React, { use } from 'react';
import { Building2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import OrganizationForm from '@/components/admin/organizations/OrganizationForm';
import { useOrganization, useUpdateOrganization } from '@/hooks/module/organization';
import { UpdateOrganizationDto } from '@/shared/dto/organization.dto';

interface EditOrganizationPageProps {
    params: Promise<{ id: string }>;
}

export default function EditOrganizationPage({ params }: EditOrganizationPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: orgData, isLoading: isLoadingOrg, isError } = useOrganization(id);
    const updateOrgMutation = useUpdateOrganization();

    const handleSubmit = async (data: UpdateOrganizationDto) => {
        try {
            await updateOrgMutation.mutateAsync({ id, data });
            toast.success('Organização atualizada com sucesso!');
            router.push('/admin/organizations');
        } catch (error: any) {
            console.error('Error updating organization:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao atualizar a organização.';
            toast.error(message);
        }
    };

    if (isLoadingOrg) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={40} className="text-primary animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando dados da organização...</p>
            </div>
        );
    }

    if (isError || !orgData) {
        return (
            <div className="max-w-4xl space-y-6">
                <div className="bg-red-50 border border-red-100 rounded-sm p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold text-red-900">Erro ao carregar organização</h2>
                    <p className="text-sm text-red-700 font-medium max-w-md mx-auto">
                        Não foi possível encontrar a organização solicitada ou ocorreu uma falha na comunicação com o servidor.
                    </p>
                    <button 
                        onClick={() => router.push('/admin/organizations')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-sm text-sm font-bold hover:bg-red-700 transition-all"
                    >
                        <ArrowLeft size={16} />
                        Voltar para lista
                    </button>
                </div>
            </div>
        );
    }

    const organization = orgData;

    return (
        <div className="max-w-4xl space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group w-fit"
                >
                    <div className="p-1.5 bg-white border border-slate-200 rounded-sm group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                        <ArrowLeft size={14} />
                    </div>
                    Voltar para lista
                </button>

                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/5 rounded-sm border border-primary/10">
                        <Building2 size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Editar Organização</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Atualizando informações de: <span className="text-primary font-bold">{organization.name}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Configurações da Entidade</h3>
                </div>
                <div className="p-8">
                    <OrganizationForm 
                        isEdit
                        initialData={{
                            name: organization.name,
                            nif: organization.nif || '',
                            address: organization.address || '',
                            phone: organization.phone || '',
                            email: organization.email || '',
                            planId: organization.planId || undefined,
                            isActive: organization.isActive
                        }}
                        onSubmit={handleSubmit} 
                        isLoading={updateOrgMutation.isPending} 
                    />
                </div>
            </div>
        </div>
    );
}
